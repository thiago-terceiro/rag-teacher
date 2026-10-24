import { describe, it, expect } from 'vitest';

describe('Micro-Calculators Mathematical Correctness', () => {
  describe('Vector Math (VectorVisualizer)', () => {
    // Dot product, cosine similarity, L2 distance
    const calcMetrics = (vA: { x: number; y: number }, vB: { x: number; y: number }) => {
      const magA = Math.sqrt(vA.x * vA.x + vA.y * vA.y);
      const magB = Math.sqrt(vB.x * vB.x + vB.y * vB.y);
      const dot = vA.x * vB.x + vA.y * vB.y;
      const cosSim = (magA > 0 && magB > 0) ? dot / (magA * magB) : 0;
      const dx = vA.x - vB.x;
      const dy = vA.y - vB.y;
      const l2 = Math.sqrt(dx * dx + dy * dy);
      const angleRad = Math.acos(Math.max(-1, Math.min(1, cosSim)));
      const angleDeg = (angleRad * 180) / Math.PI;

      return { dot, cosSim, l2, angleDeg };
    };

    it('should compute orthogonal vectors correctly', () => {
      const vA = { x: 1, y: 0 };
      const vB = { x: 0, y: 1 };
      const metrics = calcMetrics(vA, vB);

      expect(metrics.dot).toBeCloseTo(0, 5);
      expect(metrics.cosSim).toBeCloseTo(0, 5);
      expect(metrics.angleDeg).toBeCloseTo(90, 5);
      expect(metrics.l2).toBeCloseTo(Math.SQRT2, 5);
    });

    it('should compute parallel vectors correctly', () => {
      const vA = { x: 0.6, y: 0.8 };
      const vB = { x: 0.6, y: 0.8 };
      const metrics = calcMetrics(vA, vB);

      expect(metrics.cosSim).toBeCloseTo(1, 5);
      expect(metrics.angleDeg).toBeCloseTo(0, 5);
      expect(metrics.l2).toBeCloseTo(0, 5);
    });

    it('should compute opposite vectors correctly', () => {
      const vA = { x: 1, y: 0 };
      const vB = { x: -1, y: 0 };
      const metrics = calcMetrics(vA, vB);

      expect(metrics.cosSim).toBeCloseTo(-1, 5);
      expect(metrics.angleDeg).toBeCloseTo(180, 5);
      expect(metrics.l2).toBeCloseTo(2, 5);
    });

    it('should satisfy L2^2 == 2 - 2*cosSim for unit vectors', () => {
      const vA = { x: Math.cos(Math.PI / 6), y: Math.sin(Math.PI / 6) };
      const vB = { x: Math.cos(Math.PI / 3), y: Math.sin(Math.PI / 3) };
      const metrics = calcMetrics(vA, vB);

      const l2Squared = metrics.l2 * metrics.l2;
      const expectedL2Squared = 2 - 2 * metrics.cosSim;
      expect(l2Squared).toBeCloseTo(expectedL2Squared, 5);
    });
  });

  describe('Chunking Calculator Math', () => {
    const calcChunking = (docTokens: number, chunkSize: number, overlapPct: number, dim = 1536) => {
      const overlapTokens = Math.round(chunkSize * (overlapPct / 100));
      const step = Math.max(1, chunkSize - overlapTokens);
      const totalChunks = docTokens <= chunkSize ? 1 : Math.ceil((docTokens - overlapTokens) / step);
      const totalTokensIndexed = totalChunks * chunkSize;
      const redundantTokens = Math.max(0, totalTokensIndexed - docTokens);
      // float32 = 4 bytes per dimension
      const rawVectorBytes = totalChunks * dim * 4;
      const rawVectorMB = rawVectorBytes / (1024 * 1024);

      return { overlapTokens, step, totalChunks, totalTokensIndexed, redundantTokens, rawVectorMB };
    };

    it('should compute single chunk when doc is smaller than chunkSize', () => {
      const result = calcChunking(300, 512, 10);
      expect(result.totalChunks).toBe(1);
    });

    it('should compute multiple chunks with standard 10% overlap', () => {
      const result = calcChunking(5000, 500, 10);
      expect(result.overlapTokens).toBe(50);
      expect(result.step).toBe(450);
      // (5000 - 50) / 450 = 4950 / 450 = 11 chunks
      expect(result.totalChunks).toBe(11);
      expect(result.totalTokensIndexed).toBe(5500);
      expect(result.redundantTokens).toBe(500);
    });

    it('should accurately compute vector storage in MB', () => {
      // 1000 chunks of 1536-dim float32:
      // 1000 * 1536 * 4 bytes = 6,144,000 bytes = 6,144,000 / 1048576 = ~5.859 MB
      const result = calcChunking(1000 * 450 + 50, 500, 10, 1536);
      expect(result.totalChunks).toBe(1000);
      expect(result.rawVectorMB).toBeCloseTo((1000 * 1536 * 4) / (1024 * 1024), 3);
    });
  });

  describe('Reciprocal Rank Fusion (RRF) Formula', () => {
    const computeRRF = (rankDense: number | null, rankBm25: number | null, k = 60) => {
      const scoreDense = rankDense !== null ? 1 / (k + rankDense) : 0;
      const scoreBm25 = rankBm25 !== null ? 1 / (k + rankBm25) : 0;
      return scoreDense + scoreBm25;
    };

    it('should calculate standard Cormack RRF score with k=60', () => {
      // Rank 1 in both: 1/61 + 1/61 = 2/61 = ~0.032786
      const score = computeRRF(1, 1, 60);
      expect(score).toBeCloseTo(2 / 61, 6);
    });

    it('should reward consensus over isolated top rank', () => {
      // Candidate A: rank 2 in Dense, rank 2 in BM25
      const scoreConsensus = computeRRF(2, 2, 60); // 1/62 + 1/62 = 2/62 = ~0.032258
      // Candidate B: rank 1 in Dense, unranked in BM25 (e.g. rank 60)
      const scoreIsolated = computeRRF(1, 60, 60); // 1/61 + 1/120 = 0.016393 + 0.008333 = ~0.024726

      expect(scoreConsensus).toBeGreaterThan(scoreIsolated);
    });

    it('higher k should smooth differences between top ranks', () => {
      const scoreDiffK60 = computeRRF(1, 1, 60) - computeRRF(5, 5, 60);
      const scoreDiffK100 = computeRRF(1, 1, 100) - computeRRF(5, 5, 100);

      expect(scoreDiffK100).toBeLessThan(scoreDiffK60);
    });
  });
});

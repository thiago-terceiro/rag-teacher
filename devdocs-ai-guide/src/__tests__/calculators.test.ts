import { describe, it, expect } from 'vitest';
import { calculateVectorMetrics } from '../lib/vectorMath';
import { calculateChunkMetrics } from '../lib/chunkingMath';
import { calculateRRF } from '../lib/rrfMath';

describe('Micro-Calculators Mathematical Correctness', () => {
  describe('Vector Math (VectorVisualizer)', () => {
    it('should compute orthogonal vectors correctly', () => {
      const vA = { x: 1, y: 0 };
      const vB = { x: 0, y: 1 };
      const metrics = calculateVectorMetrics(vA, vB);

      expect(metrics.dot).toBeCloseTo(0, 5);
      expect(metrics.cosSim).toBeCloseTo(0, 5);
      expect(metrics.angleDeg).toBeCloseTo(90, 5);
      expect(metrics.l2).toBeCloseTo(Math.SQRT2, 5);
    });

    it('should compute parallel vectors correctly', () => {
      const vA = { x: 0.6, y: 0.8 };
      const vB = { x: 0.6, y: 0.8 };
      const metrics = calculateVectorMetrics(vA, vB);

      expect(metrics.cosSim).toBeCloseTo(1, 5);
      expect(metrics.angleDeg).toBeCloseTo(0, 5);
      expect(metrics.l2).toBeCloseTo(0, 5);
    });

    it('should compute opposite vectors correctly', () => {
      const vA = { x: 1, y: 0 };
      const vB = { x: -1, y: 0 };
      const metrics = calculateVectorMetrics(vA, vB);

      expect(metrics.cosSim).toBeCloseTo(-1, 5);
      expect(metrics.angleDeg).toBeCloseTo(180, 5);
      expect(metrics.l2).toBeCloseTo(2, 5);
    });

    it('should satisfy L2^2 == 2 - 2*cosSim for unit vectors', () => {
      const vA = { x: Math.cos(Math.PI / 6), y: Math.sin(Math.PI / 6) };
      const vB = { x: Math.cos(Math.PI / 3), y: Math.sin(Math.PI / 3) };
      const metrics = calculateVectorMetrics(vA, vB);

      const l2Squared = metrics.l2 * metrics.l2;
      const expectedL2Squared = 2 - 2 * metrics.cosSim;
      expect(l2Squared).toBeCloseTo(expectedL2Squared, 5);
    });
  });

  describe('Chunking Calculator Math', () => {
    it('should compute single chunk when doc is smaller than chunkSize', () => {
      const result = calculateChunkMetrics(300, 512, 10);
      expect(result.numChunks).toBe(1);
    });

    it('should compute multiple chunks with standard 10% overlap', () => {
      const result = calculateChunkMetrics(5000, 500, 10);
      expect(result.overlapTokens).toBe(50);
      expect(result.stride).toBe(450);
      // (5000 - 50) / 450 = 4950 / 450 = 11 chunks
      expect(result.numChunks).toBe(11);
      expect(result.totalStoredTokens).toBe(5500);
      expect(result.extraOverheadPct).toBe(10);
    });

    it('should accurately compute vector storage in MB', () => {
      // 1000 chunks of 1536-dim float32:
      // 1000 * 1536 * 4 bytes = 6,144,000 bytes = 6,144,000 / 1048576 = ~5.859 MB
      const result = calculateChunkMetrics(1000 * 450 + 50, 500, 10, 1536);
      expect(result.numChunks).toBe(1000);
      expect(result.rawVectorMB).toBeCloseTo((1000 * 1536 * 4) / (1024 * 1024), 3);
    });
  });

  describe('Reciprocal Rank Fusion (RRF) Formula', () => {
    it('should calculate standard Cormack RRF score with k=60', () => {
      // Rank 1 in both: 1/61 + 1/61 = 2/61 = ~0.032786
      const docs = [{ id: '1', title: 'Doc 1', vectorRank: 1, bm25Rank: 1 }];
      const scored = calculateRRF(docs, 60);
      expect(scored[0].rrfScore).toBeCloseTo(2 / 61, 6);
    });

    it('should reward consensus over isolated top rank', () => {
      const docs = [
        { id: 'consensus', title: 'Consensus', vectorRank: 2, bm25Rank: 2 },
        { id: 'isolated', title: 'Isolated', vectorRank: 1, bm25Rank: 60 },
      ];
      const scored = calculateRRF(docs, 60);
      const consensusDoc = scored.find((d) => d.id === 'consensus')!;
      const isolatedDoc = scored.find((d) => d.id === 'isolated')!;

      expect(consensusDoc.rrfScore).toBeGreaterThan(isolatedDoc.rrfScore);
      expect(scored[0].id).toBe('consensus');
    });

    it('higher k should smooth differences between top ranks', () => {
      const docsPair = [
        { id: 'top', title: 'Top', vectorRank: 1, bm25Rank: 1 },
        { id: 'fifth', title: 'Fifth', vectorRank: 5, bm25Rank: 5 },
      ];
      const scoredK60 = calculateRRF(docsPair, 60);
      const scoreDiffK60 = scoredK60[0].rrfScore - scoredK60[1].rrfScore;

      const scoredK100 = calculateRRF(docsPair, 100);
      const scoreDiffK100 = scoredK100[0].rrfScore - scoredK100[1].rrfScore;

      expect(scoreDiffK100).toBeLessThan(scoreDiffK60);
    });
  });
});

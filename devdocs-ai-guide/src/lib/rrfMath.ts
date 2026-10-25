/**
 * Reciprocal Rank Fusion (RRF) Cormack Algorithm Math
 */

export interface BaseRRFDoc {
  id: string;
  title: string;
  vectorRank: number;
  bm25Rank: number;
  tag?: string;
}

export interface ScoredRRFDoc extends BaseRRFDoc {
  vectorScore: number;
  bm25Score: number;
  rrfScore: number;
  fusedRank: number;
  barWidthPct: number;
}

export function calculateRRF<T extends BaseRRFDoc>(docs: readonly T[], kConstant: number): ScoredRRFDoc[] {
  const scored = docs.map((doc) => {
    const vectorScore = 1 / (kConstant + doc.vectorRank);
    const bm25Score = 1 / (kConstant + doc.bm25Rank);
    const rrfScore = vectorScore + bm25Score;

    return {
      ...doc,
      vectorScore,
      bm25Score,
      rrfScore,
    };
  });

  // Sort descending by fused RRF score
  scored.sort((a, b) => b.rrfScore - a.rrfScore);

  const maxScore = scored[0]?.rrfScore || 1;
  return scored.map((item, idx) => ({
    ...item,
    fusedRank: idx + 1,
    barWidthPct: Math.round((item.rrfScore / maxScore) * 100),
  }));
}

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
  const safeK = Math.max(1, Number.isFinite(kConstant) ? kConstant : 60);

  if (!docs || docs.length === 0) {
    return [];
  }

  const scored = docs.map((doc) => {
    const vRank = Math.max(1, Number.isFinite(doc.vectorRank) ? doc.vectorRank : 1);
    const bRank = Math.max(1, Number.isFinite(doc.bm25Rank) ? doc.bm25Rank : 1);
    const vectorScore = 1 / (safeK + vRank);
    const bm25Score = 1 / (safeK + bRank);
    const rrfScore = vectorScore + bm25Score;

    return {
      ...doc,
      vectorRank: vRank,
      bm25Rank: bRank,
      vectorScore,
      bm25Score,
      rrfScore,
    };
  });

  // Sort descending by fused RRF score, with deterministic tie-breaking by id
  scored.sort((a, b) => {
    const diff = b.rrfScore - a.rrfScore;
    if (Math.abs(diff) > 1e-9) return diff;
    return a.id.localeCompare(b.id);
  });

  const maxScore = scored[0]?.rrfScore > 0 ? scored[0].rrfScore : 1;
  return scored.map((item, idx) => ({
    ...item,
    fusedRank: idx + 1,
    barWidthPct: Math.min(100, Math.max(1, Math.round((item.rrfScore / maxScore) * 100))),
  }));
}

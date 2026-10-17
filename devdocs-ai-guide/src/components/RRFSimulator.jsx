import React, { useState, useMemo, memo } from 'react';
import { GitMerge, Sparkles, Sliders, Trophy, ArrowUpDown, Info } from 'lucide-react';
import { cn } from '../lib/utils';

const INITIAL_DOCS = [
  { id: 'doc-1', title: 'HNSW Graph Indexing (M=16, ef=64)', vectorRank: 1, bm25Rank: 7, tag: 'Architecture' },
  { id: 'doc-2', title: 'Two-Stage Cross-Encoder Reranking', vectorRank: 4, bm25Rank: 1, tag: 'Reranker' },
  { id: 'doc-3', title: 'FastAPI Little\'s Law Backpressure', vectorRank: 2, bm25Rank: 6, tag: 'Backend' },
  { id: 'doc-4', title: 'LangGraph Lyapunov Potential Proof', vectorRank: 8, bm25Rank: 2, tag: 'Agents' },
  { id: 'doc-5', title: 'Ragas Faithfulness & Precision', vectorRank: 3, bm25Rank: 3, tag: 'Evaluation' },
];

function RRFSimulator() {
  const [kConstant, setKConstant] = useState(60);
  const [docs, setDocs] = useState(INITIAL_DOCS);

  // Compute RRF scores and fused rankings in O(N log N) with pure memoized arithmetic
  const rankedDocs = useMemo(() => {
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

    // Normalize fused scores relative to the top document for sleek bar visualization
    const maxScore = scored[0]?.rrfScore || 1;
    return scored.map((item, idx) => ({
      ...item,
      fusedRank: idx + 1,
      barWidthPct: Math.round((item.rrfScore / maxScore) * 100),
    }));
  }, [docs, kConstant]);

  const updateDocRank = (docId, field, newRank) => {
    setDocs((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, [field]: Math.max(1, Math.min(20, newRank)) } : d))
    );
  };

  const resetDefaults = () => {
    setKConstant(60);
    setDocs(INITIAL_DOCS);
  };

  return (
    <div className="my-8 rounded-2xl border border-border/80 bg-card/70 backdrop-blur-md p-5 sm:p-6 shadow-xl transition-all duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border/60 gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <GitMerge className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              Reciprocal Rank Fusion (RRF) Hybrid Search Simulator
              <span className="text-[10px] uppercase tracking-wider font-mono px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30">
                Interactive
              </span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Simulate multi-retriever rank merging using Cormack's algorithm: $\text{RRF}(d) = \sum \frac{1}{k + r_m(d)}$.
            </p>
          </div>
        </div>

        <button
          onClick={resetDefaults}
          className="self-start sm:self-auto px-2.5 py-1 text-xs rounded-lg bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground border border-border/60 transition-colors cursor-pointer"
        >
          Reset Ranks
        </button>
      </div>

      {/* Smoothing Constant k Slider */}
      <div className="pt-4 pb-2">
        <div className="flex justify-between items-center text-xs mb-1.5">
          <span className="text-muted-foreground font-medium flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-purple-400" />
            RRF Smoothing Constant ($k$)
          </span>
          <span className="font-mono font-bold text-purple-400 text-sm">
            k = {kConstant} {kConstant === 60 ? '(Cormack Standard)' : ''}
          </span>
        </div>
        <input
          type="range"
          min="10"
          max="120"
          step="5"
          value={kConstant}
          onChange={(e) => setKConstant(Number(e.target.value))}
          className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-purple-500"
        />
        <div className="flex justify-between text-[10px] font-mono text-muted-foreground mt-1">
          <span>k=10 (Aggressive rank bias)</span>
          <span>k=60 (Production standard)</span>
          <span>k=120 (Smooth uniform dampening)</span>
        </div>
      </div>

      {/* Live Fused Ranking Table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="border-b border-border/60 text-muted-foreground text-[11px] uppercase tracking-wider font-semibold">
              <th className="py-2.5 px-3">Fused Rank</th>
              <th className="py-2.5 px-3">Document</th>
              <th className="py-2.5 px-3 text-center">Dense Rank (Vector)</th>
              <th className="py-2.5 px-3 text-center">Sparse Rank (BM25)</th>
              <th className="py-2.5 px-3">Fused RRF Score & Relative Strength</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40 font-mono">
            {rankedDocs.map((doc) => {
              const isWinner = doc.fusedRank === 1;
              return (
                <tr
                  key={doc.id}
                  className={cn(
                    'transition-colors duration-150',
                    isWinner ? 'bg-purple-500/10' : 'hover:bg-secondary/30'
                  )}
                >
                  {/* Fused Rank Column */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5 font-bold">
                      {isWinner ? (
                        <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                      ) : (
                        <span className="text-muted-foreground">#{doc.fusedRank}</span>
                      )}
                      <span className={isWinner ? 'text-purple-300 font-extrabold text-sm' : 'text-foreground'}>
                        #{doc.fusedRank}
                      </span>
                    </div>
                  </td>

                  {/* Document Title & Tag */}
                  <td className="py-3 px-3 font-sans">
                    <div className="font-medium text-foreground text-xs">{doc.title}</div>
                    <span className="text-[10px] text-muted-foreground bg-secondary/80 px-1.5 py-0.2 rounded border border-border/50">
                      {doc.tag}
                    </span>
                  </td>

                  {/* Vector Rank Stepper */}
                  <td className="py-3 px-3 text-center">
                    <div className="inline-flex items-center justify-center gap-1.5 bg-secondary/60 rounded-lg p-1 border border-border/60">
                      <button
                        onClick={() => updateDocRank(doc.id, 'vectorRank', doc.vectorRank - 1)}
                        className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-6 text-center font-bold text-blue-400">#{doc.vectorRank}</span>
                      <button
                        onClick={() => updateDocRank(doc.id, 'vectorRank', doc.vectorRank + 1)}
                        className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </td>

                  {/* BM25 Rank Stepper */}
                  <td className="py-3 px-3 text-center">
                    <div className="inline-flex items-center justify-center gap-1.5 bg-secondary/60 rounded-lg p-1 border border-border/60">
                      <button
                        onClick={() => updateDocRank(doc.id, 'bm25Rank', doc.bm25Rank - 1)}
                        className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-6 text-center font-bold text-emerald-400">#{doc.bm25Rank}</span>
                      <button
                        onClick={() => updateDocRank(doc.id, 'bm25Rank', doc.bm25Rank + 1)}
                        className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </td>

                  {/* Fused Score Bar */}
                  <td className="py-3 px-3 min-w-[180px]">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-purple-300 font-bold">{doc.rrfScore.toFixed(5)}</span>
                        <span className="text-muted-foreground">{doc.barWidthPct}%</span>
                      </div>
                      <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                        <div
                          style={{ width: `${doc.barWidthPct}%` }}
                          className={cn(
                            'h-full rounded-full transition-all duration-300',
                            isWinner
                              ? 'bg-gradient-to-r from-purple-500 to-indigo-400 shadow-[0_0_8px_rgba(168,85,247,0.6)]'
                              : 'bg-purple-500/60'
                          )}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Architecture Takeaway */}
      <div className="mt-4 p-3 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-start gap-2.5 text-xs text-muted-foreground">
        <Sparkles className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
        <div className="leading-relaxed">
          <span className="font-semibold text-purple-300">Architecture Invariant:</span> Notice how Doc #5
          (which placed 3rd in Vector and 3rd in BM25) often beats a document that was #1 in Vector but completely missed in BM25.
          This proves why RRF eliminates blind spots in pure dense retrieval and eliminates the need to normalize raw Cosine vs BM25 logits!
        </div>
      </div>
    </div>
  );
}

export default memo(RRFSimulator);

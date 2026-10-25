import React, { useState, useMemo } from 'react';
import { GitMerge, Trophy, Sliders } from 'lucide-react';
import { cn } from '../lib/utils';
import { calculateRRF, type BaseRRFDoc, type ScoredRRFDoc } from '../lib/rrfMath';
import { useI18n } from '../hooks/useI18n';

export interface RRFDoc extends BaseRRFDoc {
  tag: string;
}

const INITIAL_DOCS: readonly RRFDoc[] = [
  { id: 'doc-1', title: 'HNSW Graph Indexing (M=16, ef=64)', vectorRank: 1, bm25Rank: 7, tag: 'Architecture' },
  { id: 'doc-2', title: 'Two-Stage Cross-Encoder Reranking', vectorRank: 4, bm25Rank: 1, tag: 'Reranker' },
  { id: 'doc-3', title: 'FastAPI Little\'s Law Backpressure', vectorRank: 2, bm25Rank: 6, tag: 'Backend' },
  { id: 'doc-4', title: 'LangGraph Lyapunov Potential Proof', vectorRank: 8, bm25Rank: 2, tag: 'Agents' },
  { id: 'doc-5', title: 'Ragas Faithfulness & Precision', vectorRank: 3, bm25Rank: 3, tag: 'Evaluation' },
];

function RRFSimulator(): React.JSX.Element {
  const [kConstant, setKConstant] = useState<number>(60);
  const [docs, setDocs] = useState<RRFDoc[]>([...INITIAL_DOCS]);
  const { t } = useI18n();

  // Compute RRF scores and fused rankings in O(N log N) using pure library function
  const rankedDocs = useMemo<ScoredRRFDoc[]>(() => {
    return calculateRRF(docs, kConstant);
  }, [docs, kConstant]);

  const updateDocRank = (docId: string, field: 'vectorRank' | 'bm25Rank', newRank: number) => {
    setDocs((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, [field]: Math.max(1, Math.min(20, newRank)) } : d))
    );
  };

  const resetDefaults = () => {
    setKConstant(60);
    setDocs([...INITIAL_DOCS]);
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
              {t('rrf.title', 'Reciprocal Rank Fusion (RRF) Hybrid Search Simulator')}
              <span className="text-[10px] uppercase tracking-wider font-mono px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30">
                {t('common.interactive', 'Interactive')}
              </span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {"Simulate multi-retriever rank merging using Cormack's algorithm: RRF(d) = \\sum \\frac{1}{k + r_m(d)}."}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={resetDefaults}
          aria-label={t('rrf.resetAria', 'Reset document ranks to default values')}
          className="self-start sm:self-auto px-2.5 py-1 text-xs rounded-lg bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground border border-border/60 transition-colors cursor-pointer"
        >
          {t('rrf.reset', 'Reset Ranks')}
        </button>
      </div>

      {/* Smoothing Constant k Slider */}
      <div className="pt-4 pb-2">
        <div className="flex justify-between items-center text-xs mb-1.5">
          <label htmlFor="rrf-k-slider" className="text-muted-foreground font-medium flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-purple-400" aria-hidden="true" />
            {t('rrf.constantLabel', 'RRF Smoothing Constant (k)')}
          </label>
          <span className="font-mono font-bold text-purple-400 text-sm">
            k = {kConstant} {kConstant === 60 ? `(${t('rrf.standardCormack', 'Cormack Standard')})` : ''}
          </span>
        </div>
        <input
          id="rrf-k-slider"
          type="range"
          min="10"
          max="120"
          step="5"
          value={kConstant}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setKConstant(Number(e.target.value))}
          aria-label={t('rrf.constantAria', 'RRF Smoothing Constant k')}
          aria-valuemin={10}
          aria-valuemax={120}
          aria-valuenow={kConstant}
          aria-valuetext={`k equals ${kConstant}`}
          className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-purple-500"
        />
        <div className="flex justify-between text-[10px] font-mono text-muted-foreground mt-1" aria-hidden="true">
          <span>k=10 (Aggressive rank bias)</span>
          <span>k=60 (Production standard)</span>
          <span>k=120 (Smooth uniform dampening)</span>
        </div>
      </div>

      {/* Live Fused Ranking Table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-xs text-left" aria-label={t('rrf.tableAria', 'Reciprocal Rank Fusion rankings')}>
          <thead>
            <tr className="border-b border-border/60 text-muted-foreground text-[11px] uppercase tracking-wider font-semibold">
              <th scope="col" className="py-2.5 px-3">{t('rrf.fusedRank', 'Fused Rank')}</th>
              <th scope="col" className="py-2.5 px-3">{t('rrf.document', 'Document')}</th>
              <th scope="col" className="py-2.5 px-3 text-center">{t('rrf.denseRank', 'Dense Rank (Vector)')}</th>
              <th scope="col" className="py-2.5 px-3 text-center">{t('rrf.sparseRank', 'Sparse Rank (BM25)')}</th>
              <th scope="col" className="py-2.5 px-3">{t('rrf.fusedScore', 'Fused RRF Score & Relative Strength')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40 font-mono" aria-live="polite">
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
                  {/* Fused Rank Column - Fixed single rank label */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5 font-bold">
                      {isWinner && (
                        <Trophy className="w-4 h-4 text-amber-400 shrink-0" aria-label="Top ranked winner" />
                      )}
                      <span className={isWinner ? 'text-purple-300 font-extrabold text-sm' : 'text-foreground'}>
                        #{doc.fusedRank}
                      </span>
                    </div>
                  </td>

                  {/* Document Title & Tag */}
                  <td className="py-3 px-3 font-sans">
                    <div className="font-medium text-foreground text-xs">{doc.title}</div>
                    {doc.tag && (
                      <span className="text-[10px] text-muted-foreground bg-secondary/80 px-1.5 py-0.2 rounded border border-border/50">
                        {doc.tag}
                      </span>
                    )}
                  </td>

                  {/* Vector Rank Stepper */}
                  <td className="py-3 px-3 text-center">
                    <div className="inline-flex items-center justify-center gap-1.5 bg-secondary/60 rounded-lg p-1 border border-border/60">
                      <button
                        type="button"
                        disabled={doc.vectorRank <= 1}
                        onClick={() => updateDocRank(doc.id, 'vectorRank', doc.vectorRank - 1)}
                        aria-label={`Promote vector rank for ${doc.title}`}
                        className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        -
                      </button>
                      <span className="w-6 text-center font-bold text-blue-400">#{doc.vectorRank}</span>
                      <button
                        type="button"
                        disabled={doc.vectorRank >= 20}
                        onClick={() => updateDocRank(doc.id, 'vectorRank', doc.vectorRank + 1)}
                        aria-label={`Demote vector rank for ${doc.title}`}
                        className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        +
                      </button>
                    </div>
                  </td>

                  {/* BM25 Rank Stepper */}
                  <td className="py-3 px-3 text-center">
                    <div className="inline-flex items-center justify-center gap-1.5 bg-secondary/60 rounded-lg p-1 border border-border/60">
                      <button
                        type="button"
                        disabled={doc.bm25Rank <= 1}
                        onClick={() => updateDocRank(doc.id, 'bm25Rank', doc.bm25Rank - 1)}
                        aria-label={`Promote BM25 rank for ${doc.title}`}
                        className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        -
                      </button>
                      <span className="w-6 text-center font-bold text-emerald-400">#{doc.bm25Rank}</span>
                      <button
                        type="button"
                        disabled={doc.bm25Rank >= 20}
                        onClick={() => updateDocRank(doc.id, 'bm25Rank', doc.bm25Rank + 1)}
                        aria-label={`Demote BM25 rank for ${doc.title}`}
                        className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        +
                      </button>
                    </div>
                  </td>

                  {/* Fused Score Bar */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-secondary/60 h-2 rounded-full overflow-hidden border border-border/40">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-300',
                            isWinner ? 'bg-gradient-to-r from-purple-500 to-indigo-400' : 'bg-primary/70'
                          )}
                          style={{ width: `${doc.barWidthPct}%` }}
                        />
                      </div>
                      <span className="w-16 text-right font-bold text-foreground">
                        {doc.rrfScore.toFixed(5)}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default React.memo(RRFSimulator);

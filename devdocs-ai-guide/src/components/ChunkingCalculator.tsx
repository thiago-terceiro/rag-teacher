import React, { useState, useMemo } from 'react';
import { Layers } from 'lucide-react';
import { calculateChunkMetrics, type ChunkMetrics } from '../lib/chunkingMath';
import { useI18n } from '../hooks/useI18n';

export interface ChunkPreset {
  name: string;
  length: number;
  chunkSize: number;
  overlapPct: number;
  desc: string;
}

export interface VisualSegment {
  id: number;
  start: number;
  end: number;
  widthPct: number;
  leftPct: number;
}

const PRESETS: readonly ChunkPreset[] = [
  { name: 'Sentence Window', length: 1200, chunkSize: 256, overlapPct: 15, desc: 'High granularity, low boundary loss' },
  { name: 'Standard RAG', length: 2400, chunkSize: 512, overlapPct: 20, desc: 'Balanced context & storage overhead' },
  { name: 'Long-Context', length: 4800, chunkSize: 1024, overlapPct: 12, desc: 'High retrieval coherence for papers' },
];

function ChunkingCalculator(): React.JSX.Element {
  const [docLength, setDocLength] = useState<number>(2000);
  const [chunkSize, setChunkSize] = useState<number>(512);
  const [overlapPct, setOverlapPct] = useState<number>(20);
  const { t } = useI18n();

  // O(1) synchronous math using pure library module
  const metrics: ChunkMetrics = useMemo(() => {
    return calculateChunkMetrics(docLength, chunkSize, overlapPct);
  }, [docLength, chunkSize, overlapPct]);

  // Calculate visual chunk segments (limit to 10 for high-performance rendering)
  const visualSegments: VisualSegment[] = useMemo(() => {
    const segments: VisualSegment[] = [];
    const displayChunks = Math.min(metrics.numChunks, 10);
    const scale = docLength > 0 ? 100 / docLength : 0;

    for (let i = 0; i < displayChunks; i++) {
      const start = i * metrics.stride;
      const end = Math.min(docLength, start + chunkSize);
      const widthPct = Math.min(100, (end - start) * scale);
      const leftPct = Math.min(100, start * scale);

      segments.push({
        id: i,
        start,
        end,
        widthPct,
        leftPct,
      });
    }
    return segments;
  }, [metrics.numChunks, metrics.stride, docLength, chunkSize]);

  const applyPreset = (preset: ChunkPreset) => {
    setDocLength(preset.length);
    setChunkSize(preset.chunkSize);
    setOverlapPct(preset.overlapPct);
  };

  return (
    <div className="my-8 rounded-2xl border border-border/80 bg-card/70 backdrop-blur-md p-5 sm:p-6 shadow-xl transition-all duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border/60 gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              {t('chunking.title', 'Chunking Overlap & Token Storage Simulator')}
              <span className="text-[10px] uppercase tracking-wider font-mono px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
                {t('common.interactive', 'Interactive')}
              </span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t('chunking.subtitle', 'Simulate sliding-window token indexing, overlap boundary stride, and vector database memory overhead.')}
            </p>
          </div>
        </div>

        {/* Presets */}
        <div className="flex flex-wrap gap-1.5 self-start sm:self-auto">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => applyPreset(p)}
              className="px-2.5 py-1 text-xs rounded-lg bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground border border-border/60 transition-colors cursor-pointer"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 py-5 border-b border-border/50">
        <div>
          <div className="flex justify-between items-center text-xs mb-1.5">
            <label htmlFor="doc-length-slider" className="text-muted-foreground font-medium">
              {t('chunking.docLength', 'Document Length')}
            </label>
            <span className="font-mono font-bold text-foreground">{docLength.toLocaleString()} tokens</span>
          </div>
          <input
            id="doc-length-slider"
            type="range"
            min="500"
            max="10000"
            step="100"
            value={docLength}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDocLength(Number(e.target.value))}
            aria-label="Document Length in tokens"
            aria-valuemin={500}
            aria-valuemax={10000}
            aria-valuenow={docLength}
            aria-valuetext={`${docLength} tokens`}
            className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
          />
        </div>

        <div>
          <div className="flex justify-between items-center text-xs mb-1.5">
            <label htmlFor="chunk-size-slider" className="text-muted-foreground font-medium">
              {t('chunking.chunkSize', 'Chunk Size')}
            </label>
            <span className="font-mono font-bold text-blue-400">{chunkSize} tokens</span>
          </div>
          <input
            id="chunk-size-slider"
            type="range"
            min="128"
            max="2048"
            step="64"
            value={chunkSize}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setChunkSize(Number(e.target.value))}
            aria-label="Chunk Size in tokens"
            aria-valuemin={128}
            aria-valuemax={2048}
            aria-valuenow={chunkSize}
            aria-valuetext={`${chunkSize} tokens`}
            className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        <div>
          <div className="flex justify-between items-center text-xs mb-1.5">
            <label htmlFor="overlap-slider" className="text-muted-foreground font-medium">
              {t('chunking.overlap', 'Overlap Percentage')}
            </label>
            <span className="font-mono font-bold text-emerald-400">{overlapPct}% ({metrics.overlapTokens} tokens)</span>
          </div>
          <input
            id="overlap-slider"
            type="range"
            min="0"
            max="50"
            step="5"
            value={overlapPct}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOverlapPct(Number(e.target.value))}
            aria-label="Overlap Percentage"
            aria-valuemin={0}
            aria-valuemax={50}
            aria-valuenow={overlapPct}
            aria-valuetext={`${overlapPct} percent`}
            className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>
      </div>

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4">
        <div className="p-3 rounded-xl bg-secondary/40 border border-border/50">
          <div className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{t('chunking.stride', 'Window Stride')}</div>
          <div className="text-lg font-mono font-bold text-foreground mt-0.5">{metrics.stride} tokens</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">chunkSize - overlap</div>
        </div>

        <div className="p-3 rounded-xl bg-secondary/40 border border-border/50">
          <div className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{t('chunking.chunks', 'Total Chunks')}</div>
          <div className="text-lg font-mono font-bold text-primary mt-0.5">{metrics.numChunks}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Vector points indexed</div>
        </div>

        <div className="p-3 rounded-xl bg-secondary/40 border border-border/50">
          <div className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{t('chunking.storedTokens', 'Stored Tokens')}</div>
          <div className="text-lg font-mono font-bold text-foreground mt-0.5">{metrics.totalStoredTokens.toLocaleString()}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">{metrics.redundancyRatio}x redundancy ratio</div>
        </div>

        <div className="p-3 rounded-xl bg-secondary/40 border border-border/50">
          <div className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{t('chunking.rawVectorStorage', 'Vector RAM (Float32)')}</div>
          <div className="text-lg font-mono font-bold text-emerald-400 mt-0.5">{metrics.rawVectorMB.toFixed(2)} MB</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">1536-dim embeddings</div>
        </div>
      </div>

      {/* Visual Chunk Stacking Timeline */}
      <div className="pt-3">
        <div className="text-xs font-semibold text-muted-foreground mb-2 flex items-center justify-between">
          <span>{t('chunking.visualDistribution', 'Sliding Window Distribution (First 10 Chunks)')}</span>
          <span className="font-mono text-[10px] text-muted-foreground">0 — {docLength} tokens</span>
        </div>
        <div
          role="region"
          aria-label="Visual chunk distribution timeline"
          className="relative h-24 bg-secondary/30 rounded-xl p-2 border border-border/60 overflow-hidden flex flex-col justify-around"
        >
          {visualSegments.map((seg, idx) => {
            const hue = 210 + (idx * 15) % 90;
            return (
              <div
                key={seg.id}
                className="h-1.5 rounded-full shadow-xs transition-all duration-200"
                style={{
                  width: `${Math.max(2, seg.widthPct)}%`,
                  marginLeft: `${seg.leftPct}%`,
                  backgroundColor: `hsl(${hue}, 85%, 60%)`,
                }}
                title={`Chunk #${seg.id + 1}: [${seg.start}..${seg.end}] (${seg.end - seg.start} tokens)`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default React.memo(ChunkingCalculator);

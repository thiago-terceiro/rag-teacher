import React, { useState, useMemo, memo } from 'react';
import { Layers, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';

export interface ChunkPreset {
  name: string;
  length: number;
  chunkSize: number;
  overlapPct: number;
  desc: string;
}

export interface ChunkMetrics {
  overlapTokens: number;
  stride: number;
  numChunks: number;
  totalStoredTokens: number;
  redundancyRatio: string;
  extraOverheadPct: number;
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

  // O(1) synchronous math - zero layout thrashing
  const metrics: ChunkMetrics = useMemo(() => {
    const overlapTokens = Math.min(chunkSize - 1, Math.round((chunkSize * overlapPct) / 100));
    const stride = Math.max(1, chunkSize - overlapTokens);
    const numChunks = Math.max(1, Math.ceil((docLength - overlapTokens) / stride));
    const totalStoredTokens = numChunks * chunkSize;
    const redundancyRatio = (totalStoredTokens / docLength).toFixed(2);
    const extraOverheadPct = Math.round(((totalStoredTokens - docLength) / docLength) * 100);

    return {
      overlapTokens,
      stride,
      numChunks,
      totalStoredTokens,
      redundancyRatio,
      extraOverheadPct: Math.max(0, extraOverheadPct),
    };
  }, [docLength, chunkSize, overlapPct]);

  // Calculate visual chunk segments (limit to 10 for high-performance rendering)
  const visualSegments: VisualSegment[] = useMemo(() => {
    const segments: VisualSegment[] = [];
    const displayChunks = Math.min(metrics.numChunks, 10);
    const scale = 100 / docLength;

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
              Chunking Overlap & Token Storage Simulator
              <span className="text-[10px] uppercase tracking-wider font-mono px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
                Live 60 FPS
              </span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Simulate sliding window strides, token duplication, and vector DB indexing overhead.
            </p>
          </div>
        </div>

        {/* Presets */}
        <div className="flex items-center gap-1.5 flex-wrap" role="toolbar" aria-label="Chunking presets">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              onClick={() => applyPreset(p)}
              aria-label={`Apply ${p.name} preset: length ${p.length}, chunk size ${p.chunkSize}, overlap ${p.overlapPct}%`}
              className="px-2.5 py-1 text-xs rounded-lg bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground border border-border/60 hover:border-blue-500/40 transition-colors cursor-pointer"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Controls & Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-5">
        {/* Sliders Panel */}
        <div className="space-y-4 lg:col-span-2">
          {/* Document Length Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <label htmlFor="chunk-doc-length" className="text-muted-foreground font-medium">Document Length (Tokens)</label>
              <span className="font-mono font-semibold text-foreground">{docLength.toLocaleString()} tokens</span>
            </div>
            <input
              id="chunk-doc-length"
              type="range"
              min="500"
              max="6000"
              step="100"
              value={docLength}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDocLength(Number(e.target.value))}
              aria-label="Document Length in Tokens"
              aria-valuemin={500}
              aria-valuemax={6000}
              aria-valuenow={docLength}
              aria-valuetext={`${docLength.toLocaleString()} tokens`}
              className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          {/* Chunk Size Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <label htmlFor="chunk-size-slider" className="text-muted-foreground font-medium">Chunk Window Size ($C$)</label>
              <span className="font-mono font-semibold text-blue-400">{chunkSize} tokens</span>
            </div>
            <input
              id="chunk-size-slider"
              type="range"
              min="128"
              max="2048"
              step="64"
              value={chunkSize}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setChunkSize(Number(e.target.value))}
              aria-label="Chunk Window Size in Tokens"
              aria-valuemin={128}
              aria-valuemax={2048}
              aria-valuenow={chunkSize}
              aria-valuetext={`${chunkSize} tokens`}
              className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          {/* Overlap Percentage Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <label htmlFor="chunk-overlap-slider" className="text-muted-foreground font-medium">Overlap Percentage ($O$)</label>
              <span className="font-mono font-semibold text-indigo-400">
                {overlapPct}% ({metrics.overlapTokens} tokens)
              </span>
            </div>
            <input
              id="chunk-overlap-slider"
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
              aria-valuetext={`${overlapPct} percent, ${metrics.overlapTokens} tokens`}
              className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          {/* Visual Chunk Bands Timeline */}
          <div className="pt-2" aria-hidden="true">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Timeline Window Segmentation ({visualSegments.length}{metrics.numChunks > 10 ? '+' : ''} segments)</span>
              <span className="text-[10px] font-mono text-muted-foreground">Stride: {metrics.stride}t</span>
            </div>

            <div className="relative h-14 bg-secondary/40 rounded-xl p-1.5 border border-border/60 overflow-hidden flex flex-col justify-center">
              {/* Document Base Bar */}
              <div className="absolute inset-x-2 h-1 bg-border/40 rounded-full top-1/2 -translate-y-1/2" />

              {/* Overlapping Chunk Layers */}
              <div className="relative h-9 w-full">
                {visualSegments.map((seg, idx) => {
                  const isEven = idx % 2 === 0;
                  return (
                    <div
                      key={seg.id}
                      style={{
                        left: `${seg.leftPct}%`,
                        width: `${seg.widthPct}%`,
                        top: isEven ? '0px' : '14px',
                      }}
                      className={cn(
                        'absolute h-5 rounded-md border text-[10px] font-mono flex items-center justify-center transition-all duration-150 shadow-xs px-1 select-none',
                        isEven
                          ? 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                          : 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                      )}
                    >
                      <span className="truncate">C{idx + 1}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Calculated Metrics KPI Cards */}
        <div
          role="region"
          aria-label="Calculated Storage Metrics"
          aria-live="polite"
          className="grid grid-cols-2 lg:grid-cols-1 gap-2.5 bg-secondary/20 p-3.5 rounded-xl border border-border/60"
        >
          <div className="p-2.5 rounded-lg bg-card/60 border border-border/50">
            <div className="text-[11px] text-muted-foreground">Total Generated Chunks</div>
            <div className="text-xl font-bold font-mono text-foreground mt-0.5">
              {metrics.numChunks} <span className="text-xs font-normal text-muted-foreground">vectors</span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-card/60 border border-border/50">
            <div className="text-[11px] text-muted-foreground">Storage Multiplication</div>
            <div className="text-xl font-bold font-mono text-blue-400 mt-0.5">
              {metrics.redundancyRatio}x <span className="text-xs font-normal text-muted-foreground">({metrics.extraOverheadPct}% dup)</span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-card/60 border border-border/50 col-span-2 lg:col-span-1">
            <div className="text-[11px] text-muted-foreground">Total Stored Tokens</div>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">
              {metrics.totalStoredTokens.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">tokens</span>
            </div>
          </div>
        </div>
      </div>

      {/* Architecture Trade-Off Tip */}
      <div className="mt-4 p-3 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-start gap-2.5 text-xs text-muted-foreground">
        <Sparkles className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
        <div className="leading-relaxed">
          <span className="font-semibold text-blue-300">Architecture Invariant:</span> An overlap $O$ of{' '}
          <strong className="text-foreground">15%–20%</strong> is the production sweet spot. Less than 10% risks splitting atomic
          entities (e.g. JSON fields or equations) across boundaries; greater than 30% inflates vector database index memory and embedding
          API costs by <strong className="text-foreground">&gt;40%</strong> without retrieval recall gains.
        </div>
      </div>
    </div>
  );
}

export default memo(ChunkingCalculator);

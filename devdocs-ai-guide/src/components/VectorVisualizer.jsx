import React, { useState, useRef, useCallback, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Compass, RotateCcw, X, Info, Sparkles, Check, Move } from 'lucide-react';
import { useReadingSettings } from '../hooks/useReadingSettings';
import { cn } from '../lib/utils';

export function VectorVisualizer({ isOpen, setIsOpen }) {
  const { settings } = useReadingSettings();
  const isLightTheme = settings.theme === 'daylight-paper';

  // Vector A: angle in radians, magnitude
  const [angleA, setAngleA] = useState(Math.PI / 6); // 30 deg
  const [magA, setMagA] = useState(1.0);

  // Vector B: angle in radians, magnitude
  const [angleB, setAngleB] = useState(Math.PI / 2.5); // 72 deg
  const [magB, setMagB] = useState(1.0);

  const [isNormalized, setIsNormalized] = useState(true);
  const [draggingVector, setDraggingVector] = useState(null); // 'A' | 'B' | null

  const axisStroke = isLightTheme ? 'rgba(15,23,42,0.16)' : 'rgba(255,255,255,0.1)';
  const innerCircleStroke = isLightTheme ? 'rgba(15,23,42,0.12)' : 'rgba(255,255,255,0.06)';
  const outerCircleStroke = isNormalized
    ? 'rgba(59,130,246,0.45)'
    : isLightTheme
    ? 'rgba(15,23,42,0.22)'
    : 'rgba(255,255,255,0.15)';
  const arcStroke = isLightTheme ? 'rgba(15,23,42,0.45)' : 'rgba(255,255,255,0.4)';
  const originFill = isLightTheme ? '#0f172a' : '#ffffff';

  const svgRef = useRef(null);
  const rectRef = useRef(null);

  // Cartesian coordinates
  const effectiveMagA = isNormalized ? 1.0 : magA;
  const effectiveMagB = isNormalized ? 1.0 : magB;

  const ax = effectiveMagA * Math.cos(angleA);
  const ay = effectiveMagA * Math.sin(angleA);

  const bx = effectiveMagB * Math.cos(angleB);
  const by = effectiveMagB * Math.sin(angleB);

  // Math metrics
  const dotProduct = ax * bx + ay * by;
  const normA = Math.sqrt(ax * ax + ay * ay);
  const normB = Math.sqrt(bx * bx + by * by);
  const cosineSim = normA > 0 && normB > 0 ? Math.max(-1, Math.min(1, dotProduct / (normA * normB))) : 0;
  const angleDiffRad = Math.acos(cosineSim);
  const angleDiffDeg = (angleDiffRad * 180) / Math.PI;
  const euclideanDist = Math.sqrt(Math.pow(ax - bx, 2) + Math.pow(ay - by, 2));

  // Canvas conversion: center is (180, 180), scale: 1.0 = 120px
  const CENTER = 180;
  const SCALE = 120;

  const toSvgX = (x) => CENTER + x * SCALE;
  const toSvgY = (y) => CENTER - y * SCALE; // inverted Y

  const svgAx = toSvgX(ax);
  const svgAy = toSvgY(ay);
  const svgBx = toSvgX(bx);
  const svgBy = toSvgY(by);

  // Handle drag to aim vectors (uses cached rect from onPointerDown to avoid layout reflows)
  const handlePointerMove = useCallback((e) => {
    if (!draggingVector || !svgRef.current) return;
    const rect = rectRef.current || svgRef.current.getBoundingClientRect();
    if (!rect || !rect.width || !rect.height) return;

    // Scale client coordinates accurately to 360x360 SVG viewBox space
    const scaleX = 360 / rect.width;
    const scaleY = 360 / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    const cartX = (mouseX - CENTER) / SCALE;
    const cartY = -(mouseY - CENTER) / SCALE;

    const angle = Math.atan2(cartY, cartX);
    const rawMag = Math.sqrt(cartX * cartX + cartY * cartY);
    const clampedMag = Math.max(0.2, Math.min(1.2, rawMag));

    if (draggingVector === 'A') {
      setAngleA(angle);
      if (!isNormalized) setMagA(clampedMag);
    } else if (draggingVector === 'B') {
      setAngleB(angle);
      if (!isNormalized) setMagB(clampedMag);
    }
  }, [draggingVector, isNormalized]);

  const handlePointerUp = useCallback(() => {
    rectRef.current = null;
    setDraggingVector(null);
  }, []);

  useEffect(() => {
    if (draggingVector) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      window.addEventListener('pointercancel', handlePointerUp);
      return () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
        window.removeEventListener('pointercancel', handlePointerUp);
      };
    }
  }, [draggingVector, handlePointerMove, handlePointerUp]);

  // Arc path between vectors
  const arcRadius = 45;
  const startAngle = Math.min(angleA, angleB);
  const endAngle = Math.max(angleA, angleB);
  const isLargeArc = endAngle - startAngle > Math.PI;
  const arcStartX = CENTER + arcRadius * Math.cos(angleA);
  const arcStartY = CENTER - arcRadius * Math.sin(angleA);
  const arcEndX = CENTER + arcRadius * Math.cos(angleB);
  const arcEndY = CENTER - arcRadius * Math.sin(angleB);

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 animate-in fade-in duration-200" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-card/95 border border-border/90 rounded-2xl shadow-2xl z-50 p-6 focus:outline-none animate-in zoom-in-95 duration-200 custom-scrollbar"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-border/80">
            <div className="flex items-center space-x-2.5">
              <Compass className="w-5 h-5 text-primary animate-pulse" />
              <div>
                <Dialog.Title className="text-lg font-bold text-foreground">
                  Interactive Vector Distance & Similarity Sandbox
                </Dialog.Title>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Understand the geometric relationship between Cosine Similarity, Dot Product, and Euclidean ($L_2$) Distance
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close vector visualizer"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary text-xs transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-6">
            {/* Interactive 2D Canvas */}
            <div className="lg:col-span-7 flex flex-col items-center">
              <div className="relative p-2 rounded-2xl bg-secondary/30 border border-border/80 shadow-inner flex justify-center">
                <svg
                  ref={svgRef}
                  role="region"
                  aria-label="Interactive 2D vector coordinate space"
                  viewBox="0 0 360 360"
                  width="360"
                  height="360"
                  className="w-full max-w-[360px] aspect-square select-none touch-none cursor-crosshair"
                >
                  <defs>
                    <marker
                      id="arrow-a"
                      viewBox="0 0 10 10"
                      refX="6"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
                    </marker>
                    <marker
                      id="arrow-b"
                      viewBox="0 0 10 10"
                      refX="6"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#34d399" />
                    </marker>
                  </defs>

                  {/* Grid Lines */}
                  <line x1="0" y1={CENTER} x2="360" y2={CENTER} stroke={axisStroke} strokeWidth="1" />
                  <line x1={CENTER} y1="0" x2={CENTER} y2="360" stroke={axisStroke} strokeWidth="1" />
                  
                  {/* Subtle Grid Circles */}
                  <circle cx={CENTER} cy={CENTER} r={SCALE * 0.5} fill="none" stroke={innerCircleStroke} strokeDasharray="3 3" />
                  <circle cx={CENTER} cy={CENTER} r={SCALE} fill="none" stroke={outerCircleStroke} strokeWidth={isNormalized ? "1.5" : "1"} />

                  {/* Euclidean distance connection line between tips */}
                  <line
                    x1={svgAx}
                    y1={svgAy}
                    x2={svgBx}
                    y2={svgBy}
                    stroke="#f59e0b"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    opacity="0.8"
                  />

                  {/* Angle Arc */}
                  {Math.abs(angleDiffDeg) > 2 && (
                    <path
                      d={`M ${arcStartX} ${arcStartY} A ${arcRadius} ${arcRadius} 0 ${isLargeArc ? 1 : 0} ${angleA > angleB ? 0 : 1} ${arcEndX} ${arcEndY}`}
                      fill="none"
                      stroke={arcStroke}
                      strokeWidth="1.5"
                    />
                  )}

                  {/* Vector A (Cyan) */}
                  <line
                    x1={CENTER}
                    y1={CENTER}
                    x2={svgAx}
                    y2={svgAy}
                    stroke="#38bdf8"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    markerEnd="url(#arrow-a)"
                  />

                  {/* Vector B (Emerald) */}
                  <line
                    x1={CENTER}
                    y1={CENTER}
                    x2={svgBx}
                    y2={svgBy}
                    stroke="#34d399"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    markerEnd="url(#arrow-b)"
                  />

                  {/* Vector A Draggable & Keyboard-Accessible Tip Handle */}
                  <g
                    tabIndex={0}
                    role="slider"
                    aria-label="Vector A angle in degrees (use Arrow keys to rotate, Shift+Arrow for 15° steps)"
                    aria-valuenow={Math.round((angleA * 180) / Math.PI)}
                    aria-valuemin={-180}
                    aria-valuemax={180}
                    onKeyDown={(e) => {
                      const step = (e.shiftKey ? 15 : 5) * (Math.PI / 180);
                      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                        e.preventDefault();
                        setAngleA(prev => prev + step);
                      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                        e.preventDefault();
                        setAngleA(prev => prev - step);
                      }
                    }}
                    className="cursor-grab active:cursor-grabbing focus:outline-none"
                  >
                    {/* Wide transparent touch hit area */}
                    <circle
                      cx={svgAx}
                      cy={svgAy}
                      r="18"
                      fill="transparent"
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
                        rectRef.current = svgRef.current?.getBoundingClientRect() || null;
                        setDraggingVector('A');
                      }}
                      onPointerUp={(e) => {
                        try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
                        rectRef.current = null;
                        setDraggingVector(null);
                      }}
                    />
                    {/* Visible Handle Pin - strictly glued to (svgAx, svgAy) on the circle */}
                    <circle
                      cx={svgAx}
                      cy={svgAy}
                      r={draggingVector === 'A' ? 10 : 8}
                      fill="#38bdf8"
                      stroke="#ffffff"
                      strokeWidth="2.5"
                      pointerEvents="none"
                    />
                  </g>

                  {/* Vector B Draggable & Keyboard-Accessible Tip Handle */}
                  <g
                    tabIndex={0}
                    role="slider"
                    aria-label="Vector B angle in degrees (use Arrow keys to rotate, Shift+Arrow for 15° steps)"
                    aria-valuenow={Math.round((angleB * 180) / Math.PI)}
                    aria-valuemin={-180}
                    aria-valuemax={180}
                    onKeyDown={(e) => {
                      const step = (e.shiftKey ? 15 : 5) * (Math.PI / 180);
                      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                        e.preventDefault();
                        setAngleB(prev => prev + step);
                      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                        e.preventDefault();
                        setAngleB(prev => prev - step);
                      }
                    }}
                    className="cursor-grab active:cursor-grabbing focus:outline-none"
                  >
                    {/* Wide transparent touch hit area */}
                    <circle
                      cx={svgBx}
                      cy={svgBy}
                      r="18"
                      fill="transparent"
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
                        rectRef.current = svgRef.current?.getBoundingClientRect() || null;
                        setDraggingVector('B');
                      }}
                      onPointerUp={(e) => {
                        try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
                        rectRef.current = null;
                        setDraggingVector(null);
                      }}
                    />
                    {/* Visible Handle Pin - strictly glued to (svgBx, svgBy) on the circle */}
                    <circle
                      cx={svgBx}
                      cy={svgBy}
                      r={draggingVector === 'B' ? 10 : 8}
                      fill="#34d399"
                      stroke="#ffffff"
                      strokeWidth="2.5"
                      pointerEvents="none"
                    />
                  </g>

                  {/* Origin */}
                  <circle cx={CENTER} cy={CENTER} r="3" fill={originFill} />
                </svg>

                <div className="absolute bottom-3 left-4 text-[10px] text-muted-foreground flex items-center gap-1.5 pointer-events-none">
                  <Move className="w-3 h-3 text-primary animate-pulse" aria-hidden="true" />
                  <span>Drag vector tips or use Arrow keys when focused</span>
                </div>
              </div>

              {/* Controls */}
              <div className="w-full mt-4 flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => setIsNormalized(!isNormalized)}
                  aria-pressed={isNormalized}
                  className={cn(
                    'px-3.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer',
                    isNormalized
                      ? 'bg-primary/20 text-primary border-primary/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                      : 'bg-secondary/50 text-muted-foreground border-border hover:text-foreground'
                  )}
                >
                  <span className={cn('w-2 h-2 rounded-full', isNormalized ? 'bg-primary animate-pulse' : 'bg-muted-foreground')} aria-hidden="true" />
                  <span>Lock Unit Norm (||A|| = ||B|| = 1.0)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAngleA(Math.PI / 6);
                    setAngleB(Math.PI / 2.5);
                    setMagA(1.0);
                    setMagB(1.0);
                    setIsNormalized(true);
                  }}
                  aria-label="Reset vectors to default angles"
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary text-xs transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {/* Live Metrics & Mathematical Proofs */}
            <div aria-live="polite" className="lg:col-span-5 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Live Distance & Similarity Metrics
                </div>

                {/* Metric 1: Cosine Similarity */}
                <div className="p-3 rounded-xl bg-secondary/40 border border-border/80">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                      Cosine Similarity (cos θ)
                    </span>
                    <span className="font-mono text-xs">[-1.0 to +1.0]</span>
                  </div>
                  <div className="text-2xl font-bold font-mono text-primary mt-1">
                    {cosineSim.toFixed(4)}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 font-mono">
                    θ = {angleDiffDeg.toFixed(1)}° ({angleDiffRad.toFixed(3)} rad)
                  </div>
                </div>

                {/* Metric 2: Dot Product */}
                <div className="p-3 rounded-xl bg-secondary/40 border border-border/80">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      Dot Product (A · B)
                    </span>
                    <span className="font-mono text-xs">AxBx + AyBy</span>
                  </div>
                  <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                    {dotProduct.toFixed(4)}
                  </div>
                  {isNormalized && (
                    <div className="text-[11px] text-emerald-400/80 font-medium mt-0.5">
                      ✓ Strictly identical to Cosine Similarity when normalized!
                    </div>
                  )}
                </div>

                {/* Metric 3: Euclidean Distance (L2) */}
                <div className="p-3 rounded-xl bg-secondary/40 border border-border/80">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      Euclidean Distance (||A - B||)
                    </span>
                    <span className="font-mono text-xs">L2 Norm</span>
                  </div>
                  <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
                    {euclideanDist.toFixed(4)}
                  </div>
                  {isNormalized && (
                    <div className="text-[11px] text-amber-400/80 font-mono mt-0.5">
                      L2² = 2 - 2(cos θ) = {(2 - 2 * cosineSim).toFixed(4)}
                    </div>
                  )}
                </div>
              </div>

              {/* Systems Design Takeaway */}
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/25 text-xs text-foreground/90 space-y-2">
                <div className="font-bold text-primary flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>Systems Architect Insight:</span>
                </div>
                <p className="leading-relaxed text-[11.5px]">
                  {isNormalized ? (
                    <>
                      When embeddings are <strong>unit-normalized</strong> (standard in leading models such as Cohere and BGE), <strong>Dot Product equals Cosine Similarity</strong>. Furthermore, maximizing cosine similarity is mathematically identical to minimizing Euclidean distance:
                      <code className="block mt-1 font-mono text-[10px] bg-secondary/80 p-1.5 rounded border border-border/50 text-foreground">
                        L2² = ||A||² + ||B||² - 2(A · B) = 1 + 1 - 2(cos θ) = 2 - 2(cos θ)
                      </code>
                      This is why vector databases like Qdrant can use fast dot-product SIMD instructions ($O(D)$ multiply-accumulate) without computing expensive square roots.
                    </>
                  ) : (
                    <>
                      When embeddings are <strong>unnormalized</strong>, the Dot Product is dominated by document length and token frequency. Longer chunks produce larger magnitudes, biasing dot-product retrieval toward bloated documents regardless of semantic relevance.
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default React.memo(VectorVisualizer);

import React, { useState, useRef, useCallback, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Compass, X } from 'lucide-react';
import { useReadingSettings } from '../hooks/useReadingSettings';
import { calculateVectorMetrics } from '../lib/vectorMath';
import { useI18n } from '../hooks/useI18n';

export interface VectorVisualizerProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

function normalizeAngle(rad: number): number {
  let a = rad % (2 * Math.PI);
  if (a > Math.PI) a -= 2 * Math.PI;
  if (a < -Math.PI) a += 2 * Math.PI;
  return a;
}

export function VectorVisualizer({ isOpen, setIsOpen }: VectorVisualizerProps): React.JSX.Element {
  const { settings } = useReadingSettings();
  const { t } = useI18n();
  const isLightTheme = settings.theme === 'daylight-paper';

  // Vector A: angle in radians, magnitude
  const [angleA, setAngleA] = useState<number>(Math.PI / 6); // 30 deg
  const [magA, setMagA] = useState<number>(1.0);

  // Vector B: angle in radians, magnitude
  const [angleB, setAngleB] = useState<number>(Math.PI / 2.5); // 72 deg
  const [magB, setMagB] = useState<number>(1.0);

  const [isNormalized, setIsNormalized] = useState<boolean>(true);
  const [draggingVector, setDraggingVector] = useState<'A' | 'B' | null>(null);

  const axisStroke = isLightTheme ? 'rgba(15,23,42,0.16)' : 'rgba(255,255,255,0.1)';
  const innerCircleStroke = isLightTheme ? 'rgba(15,23,42,0.12)' : 'rgba(255,255,255,0.06)';
  const outerCircleStroke = isNormalized
    ? 'rgba(59,130,246,0.45)'
    : isLightTheme
    ? 'rgba(15,23,42,0.22)'
    : 'rgba(255,255,255,0.15)';
  const arcStroke = isLightTheme ? 'rgba(15,23,42,0.45)' : 'rgba(255,255,255,0.4)';
  const originFill = isLightTheme ? '#0f172a' : '#ffffff';

  const svgRef = useRef<SVGSVGElement | null>(null);
  const rectRef = useRef<DOMRect | null>(null);

  // Cartesian coordinates
  const effectiveMagA = isNormalized ? 1.0 : magA;
  const effectiveMagB = isNormalized ? 1.0 : magB;

  const ax = effectiveMagA * Math.cos(angleA);
  const ay = effectiveMagA * Math.sin(angleA);

  const bx = effectiveMagB * Math.cos(angleB);
  const by = effectiveMagB * Math.sin(angleB);

  // Calculate metrics using pure vectorMath library
  const metrics = calculateVectorMetrics({ x: ax, y: ay }, { x: bx, y: by });

  // Canvas conversion: center is (180, 180), scale: 1.0 = 120px
  const CENTER = 180;
  const SCALE = 120;

  const toSvgX = (x: number) => CENTER + x * SCALE;
  const toSvgY = (y: number) => CENTER - y * SCALE; // inverted Y

  const svgAx = toSvgX(ax);
  const svgAy = toSvgY(ay);
  const svgBx = toSvgX(bx);
  const svgBy = toSvgY(by);

  // Handle drag to aim vectors
  const handlePointerMove = useCallback((e: PointerEvent) => {
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

  // Robust acute arc calculation across branch cut (-PI..PI)
  const arcRadius = 45;
  const deltaAngle = ((((angleB - angleA) % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI)) - Math.PI;
  const arcStartX = CENTER + arcRadius * Math.cos(angleA);
  const arcStartY = CENTER - arcRadius * Math.sin(angleA);
  const arcEndX = CENTER + arcRadius * Math.cos(angleB);
  const arcEndY = CENTER - arcRadius * Math.sin(angleB);
  const sweepFlag = deltaAngle > 0 ? 0 : 1;

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
                  {t('vector.title', 'Interactive Vector Distance & Similarity Sandbox')}
                </Dialog.Title>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t('vector.subtitle', 'Understand the geometric relationship between Cosine Similarity, Dot Product, and Euclidean (L2) Distance')}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label={t('common.close', 'Close')}
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
                  
                  {/* Grid Circles */}
                  <circle cx={CENTER} cy={CENTER} r="60" fill="none" stroke={innerCircleStroke} strokeWidth="1" strokeDasharray="3 3" />
                  <circle cx={CENTER} cy={CENTER} r="120" fill="none" stroke={outerCircleStroke} strokeWidth={isNormalized ? "1.5" : "1"} />

                  {/* Euclidean distance chord */}
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

                  {/* Angle Arc - Exact acute angle path */}
                  {Math.abs(metrics.angleDeg) > 2 && (
                    <path
                      d={`M ${arcStartX} ${arcStartY} A ${arcRadius} ${arcRadius} 0 0 ${sweepFlag} ${arcEndX} ${arcEndY}`}
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

                  {/* Vector A Draggable Tip Handle with Visible Focus Ring */}
                  <g
                    tabIndex={0}
                    role="slider"
                    aria-label="Vector A angle in degrees (use Arrow keys to rotate, Shift+Arrow for 15° steps)"
                    aria-valuenow={Math.round((normalizeAngle(angleA) * 180) / Math.PI)}
                    aria-valuemin={-180}
                    aria-valuemax={180}
                    onKeyDown={(e: React.KeyboardEvent<SVGGElement>) => {
                      const step = (e.shiftKey ? 15 : 5) * (Math.PI / 180);
                      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                        e.preventDefault();
                        setAngleA(prev => normalizeAngle(prev + step));
                      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                        e.preventDefault();
                        setAngleA(prev => normalizeAngle(prev - step));
                      }
                    }}
                    className="cursor-grab active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <circle
                      cx={svgAx}
                      cy={svgAy}
                      r="18"
                      fill="transparent"
                      onPointerDown={(e: React.PointerEvent<SVGCircleElement>) => {
                        e.stopPropagation();
                        try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
                        rectRef.current = svgRef.current?.getBoundingClientRect() || null;
                        setDraggingVector('A');
                      }}
                    />
                    <circle
                      cx={svgAx}
                      cy={svgAy}
                      r="7"
                      fill="#38bdf8"
                      stroke="#0f172a"
                      strokeWidth="2.5"
                      className="transition-transform group-hover:scale-125"
                    />
                  </g>

                  {/* Vector B Draggable Tip Handle with Visible Focus Ring */}
                  <g
                    tabIndex={0}
                    role="slider"
                    aria-label="Vector B angle in degrees (use Arrow keys to rotate, Shift+Arrow for 15° steps)"
                    aria-valuenow={Math.round((normalizeAngle(angleB) * 180) / Math.PI)}
                    aria-valuemin={-180}
                    aria-valuemax={180}
                    onKeyDown={(e: React.KeyboardEvent<SVGGElement>) => {
                      const step = (e.shiftKey ? 15 : 5) * (Math.PI / 180);
                      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                        e.preventDefault();
                        setAngleB(prev => normalizeAngle(prev + step));
                      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                        e.preventDefault();
                        setAngleB(prev => normalizeAngle(prev - step));
                      }
                    }}
                    className="cursor-grab active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <circle
                      cx={svgBx}
                      cy={svgBy}
                      r="18"
                      fill="transparent"
                      onPointerDown={(e: React.PointerEvent<SVGCircleElement>) => {
                        e.stopPropagation();
                        try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
                        rectRef.current = svgRef.current?.getBoundingClientRect() || null;
                        setDraggingVector('B');
                      }}
                    />
                    <circle
                      cx={svgBx}
                      cy={svgBy}
                      r="7"
                      fill="#34d399"
                      stroke="#0f172a"
                      strokeWidth="2.5"
                      className="transition-transform group-hover:scale-125"
                    />
                  </g>

                  {/* Origin */}
                  <circle cx={CENTER} cy={CENTER} r="3" fill={originFill} />
                </svg>
              </div>

              {/* Normalization Mode Toggle */}
              <div className="flex items-center space-x-3 mt-4 text-xs">
                <button
                  type="button"
                  onClick={() => setIsNormalized(prev => !prev)}
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-secondary/80 hover:bg-secondary border border-border text-foreground transition-colors cursor-pointer"
                >
                  <span className={`w-2 h-2 rounded-full ${isNormalized ? 'bg-primary' : 'bg-muted-foreground'}`} />
                  <span>{isNormalized ? t('vector.unitVectors', 'Unit Vectors ||v||=1') : t('vector.arbitraryMag', 'Arbitrary Length')}</span>
                </button>
              </div>
            </div>

            {/* Metrics Panel */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/25">
                  <div className="text-xs font-semibold text-primary uppercase tracking-wider">{t('vector.cosineSim', 'Cosine Similarity')}</div>
                  <div className="text-2xl font-mono font-bold text-foreground mt-1">
                    {metrics.cosSim.toFixed(4)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {t('vector.angleTheta', 'Angle θ')}: <span className="font-mono font-semibold text-foreground">{metrics.angleDeg.toFixed(1)}°</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25">
                  <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider">{t('vector.euclideanL2', 'Euclidean (L2) Distance')}</div>
                  <div className="text-2xl font-mono font-bold text-foreground mt-1">
                    {metrics.l2.toFixed(4)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {isNormalized ? '||a - b|| = √(2 - 2·cos(θ))' : '||a - b||'}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/25">
                  <div className="text-xs font-semibold text-purple-400 uppercase tracking-wider">{t('vector.dotProduct', 'Dot Product (a · b)')}</div>
                  <div className="text-2xl font-mono font-bold text-foreground mt-1">
                    {metrics.dot.toFixed(4)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {isNormalized ? 'Identical to Cosine Similarity on unit sphere' : '||a|| · ||b|| · cos(θ)'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default React.memo(VectorVisualizer);

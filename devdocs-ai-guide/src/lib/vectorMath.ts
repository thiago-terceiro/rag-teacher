/**
 * Vector Mathematics for 2D Similarity & Metric Spaces
 */

export interface Vector2D {
  x: number;
  y: number;
}

export interface VectorMetrics {
  dot: number;
  cosSim: number;
  l2: number;
  angleDeg: number;
  angleRad: number;
}

export function calculateVectorMetrics(vA: Vector2D, vB: Vector2D): VectorMetrics {
  const ax = Number.isFinite(vA?.x) ? vA.x : 0;
  const ay = Number.isFinite(vA?.y) ? vA.y : 0;
  const bx = Number.isFinite(vB?.x) ? vB.x : 0;
  const by = Number.isFinite(vB?.y) ? vB.y : 0;

  const magA = Math.hypot(ax, ay);
  const magB = Math.hypot(bx, by);
  const rawDot = ax * bx + ay * by;
  const dx = ax - bx;
  const dy = ay - by;
  const l2 = Math.hypot(dx, dy);

  let cosSim = 0;
  let angleRad = 0;
  let angleDeg = 0;

  if (magA > 0 && magB > 0) {
    // Normalizing unit components first prevents intermediate IEEE 754 overflow/underflow
    const uAx = ax / magA;
    const uAy = ay / magA;
    const uBx = bx / magB;
    const uBy = by / magB;
    const normalizedDot = uAx * uBx + uAy * uBy;
    cosSim = Math.max(-1, Math.min(1, normalizedDot));
    angleRad = Math.acos(cosSim);
    angleDeg = (angleRad * 180) / Math.PI;
  } else if (magA === 0 && magB === 0) {
    cosSim = 1;
    angleRad = 0;
    angleDeg = 0;
  } else {
    cosSim = 0;
    angleRad = Math.PI / 2;
    angleDeg = 90;
  }

  const dot = Number.isFinite(rawDot) ? rawDot : cosSim * magA * magB;

  return { dot, cosSim, l2, angleDeg, angleRad };
}

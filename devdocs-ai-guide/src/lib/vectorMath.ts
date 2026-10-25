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
  const magA = Math.sqrt(vA.x * vA.x + vA.y * vA.y);
  const magB = Math.sqrt(vB.x * vB.x + vB.y * vB.y);
  const dot = vA.x * vB.x + vA.y * vB.y;
  const cosSim = magA > 0 && magB > 0 ? Math.max(-1, Math.min(1, dot / (magA * magB))) : 0;
  const dx = vA.x - vB.x;
  const dy = vA.y - vB.y;
  const l2 = Math.sqrt(dx * dx + dy * dy);
  const angleRad = Math.acos(cosSim);
  const angleDeg = (angleRad * 180) / Math.PI;

  return { dot, cosSim, l2, angleDeg, angleRad };
}

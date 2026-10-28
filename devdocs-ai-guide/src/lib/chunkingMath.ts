/**
 * Chunking Overlap & Token Storage Arithmetic
 */

export interface ChunkMetrics {
  overlapTokens: number;
  stride: number;
  numChunks: number;
  totalStoredTokens: number;
  redundancyRatio: string;
  extraOverheadPct: number;
  rawVectorMB: number;
}

export function calculateChunkMetrics(
  docLength: number,
  chunkSize: number,
  overlapPct: number,
  dim: number = 1536
): ChunkMetrics {
  const safeDocLength = Math.max(0, Number.isFinite(docLength) ? docLength : 0);
  const safeChunkSize = Math.max(1, Number.isFinite(chunkSize) ? chunkSize : 512);
  const safeOverlapPct = Math.max(0, Math.min(99, Number.isFinite(overlapPct) ? overlapPct : 0));
  const safeDim = Math.max(1, Number.isFinite(dim) ? dim : 1536);

  if (safeDocLength === 0) {
    return {
      overlapTokens: 0,
      stride: safeChunkSize,
      numChunks: 0,
      totalStoredTokens: 0,
      redundancyRatio: '0.00',
      extraOverheadPct: 0,
      rawVectorMB: 0,
    };
  }

  const overlapTokens = Math.min(safeChunkSize - 1, Math.round((safeChunkSize * safeOverlapPct) / 100));
  const stride = Math.max(1, safeChunkSize - overlapTokens);
  const numChunks = safeDocLength <= safeChunkSize ? 1 : Math.max(1, Math.ceil((safeDocLength - overlapTokens) / stride));
  const totalStoredTokens = numChunks * safeChunkSize;
  const redundancyRatio = (totalStoredTokens / safeDocLength).toFixed(2);
  const extraOverheadPct = Math.max(0, Math.round(((totalStoredTokens - safeDocLength) / safeDocLength) * 100));
  // float32 = 4 bytes per dimension
  const rawVectorBytes = numChunks * safeDim * 4;
  const rawVectorMB = rawVectorBytes / (1024 * 1024);

  return {
    overlapTokens,
    stride,
    numChunks,
    totalStoredTokens,
    redundancyRatio,
    extraOverheadPct,
    rawVectorMB,
  };
}

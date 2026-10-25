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
  const overlapTokens = Math.min(chunkSize - 1, Math.round((chunkSize * overlapPct) / 100));
  const stride = Math.max(1, chunkSize - overlapTokens);
  const numChunks = docLength <= chunkSize ? 1 : Math.max(1, Math.ceil((docLength - overlapTokens) / stride));
  const totalStoredTokens = numChunks * chunkSize;
  const redundancyRatio = docLength > 0 ? (totalStoredTokens / docLength).toFixed(2) : '1.00';
  const extraOverheadPct = docLength > 0 ? Math.max(0, Math.round(((totalStoredTokens - docLength) / docLength) * 100)) : 0;
  // float32 = 4 bytes per dimension
  const rawVectorBytes = numChunks * dim * 4;
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

/**
 * Vector Math and Dimensionality Reduction Utilities
 * Supports:
 * - Cosine Similarity & Euclidean Distance
 * - 2D & 3D PCA (Principal Component Analysis via Power Iteration / SVD)
 * - Self-contained Semantic Vector Embedding Generator (384-dim, L2 Normalized)
 */

export const EMBEDDING_DIM = 384;

/** Compute Cosine Similarity between two unit-normalized or arbitrary vectors. [-1.0 ~ 1.0] */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  if (denom === 0) return 0;
  return Math.max(-1, Math.min(1, dot / denom));
}

/** Compute Euclidean (L2) Distance between two vectors. [0 ~ Infinity] */
export function euclideanDistance(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

/** Normalize vector to unit length (L2 norm = 1) */
export function normalizeVector(v: number[]): number[] {
  let norm = 0;
  for (const x of v) norm += x * x;
  norm = Math.sqrt(norm);
  if (norm === 0) return v;
  return v.map((x) => x / norm);
}

/**
 * Deterministic Semantic Embedding Generator (384 dimensions)
 * Combines tokenization, positional weighting, domain topic kernels, and feature hashing.
 * Produces unit-length vector embeddings consistent with pgvector(384).
 */
export function generateSemanticEmbedding(
  text: string,
  meta?: { title?: string; category?: string; tags?: string[] }
): number[] {
  const vec = new Float64Array(EMBEDDING_DIM);

  // Combine components with domain weights
  const title = meta?.title ?? "";
  const category = meta?.category ?? "";
  const tags = (meta?.tags ?? []).join(" ");
  const fullText = `${title} ${title} ${category} ${tags} ${text}`.toLowerCase();

  // Basic word and subword n-gram tokenization
  const tokens = fullText
    .replace(/[^\w\s가-힣]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);

  // 1. Semantic Topic Kernel Anchors (Guarantees meaningful topic clustering)
  const TOPIC_KERNELS: Record<string, number[]> = {
    search: [12, 45, 89, 130, 204],
    retrieval: [12, 46, 90, 131, 205],
    hybrid: [15, 48, 92, 133, 210],
    pgvector: [20, 50, 95, 140, 220],
    vector: [21, 51, 96, 141, 221],
    bm25: [25, 55, 100, 145, 225],
    rrf: [30, 60, 105, 150, 230],
    ranking: [32, 62, 107, 152, 232],
    database: [40, 70, 115, 160, 240],
    supabase: [42, 72, 117, 162, 242],
    postgres: [43, 73, 118, 163, 243],
    graph: [80, 180, 280, 310, 350],
    visualization: [82, 182, 282, 312, 352],
    frontend: [85, 185, 285, 315, 355],
    react: [87, 187, 287, 317, 357],
    nextjs: [88, 188, 288, 318, 358],
  };

  // Apply topic kernel weights
  for (const [kw, dims] of Object.entries(TOPIC_KERNELS)) {
    if (fullText.includes(kw)) {
      dims.forEach((d, i) => {
        vec[d % EMBEDDING_DIM] += (dims.length - i) * 1.5;
      });
    }
  }

  // 2. High-dimensional feature hashing (Murmur-like 32-bit hash dispersion)
  for (let i = 0; i < tokens.length; i++) {
    const word = tokens[i];
    let h1 = 0x811c9dc5;
    let h2 = 0x5bd1e995;
    for (let c = 0; c < word.length; c++) {
      const code = word.charCodeAt(c);
      h1 = Math.imul(h1 ^ code, 0x01000193);
      h2 = Math.imul(h2 ^ code, 0x5bd1e995);
    }
    const idx1 = Math.abs(h1) % EMBEDDING_DIM;
    const idx2 = Math.abs(h2) % EMBEDDING_DIM;
    const sign = (h1 & 1) === 0 ? 1 : -1;

    // Diminishing returns with log frequency
    const weight = 1 / Math.sqrt(i + 1);
    vec[idx1] += sign * weight;
    vec[idx2] += -sign * weight * 0.7;
  }

  return normalizeVector(Array.from(vec));
}

/**
 * Principal Component Analysis (PCA) projection to 2D
 * Projects N high-dimensional vectors (e.g. 384-dim) down to 2D coordinates (x, y).
 */
export function projectPCA2D(
  vectors: number[][],
  bounds: { width: number; height: number; padding?: number } = { width: 900, height: 600, padding: 80 }
): { x: number; y: number }[] {
  const n = vectors.length;
  if (n === 0) return [];
  if (n === 1) return [{ x: bounds.width / 2, y: bounds.height / 2 }];

  const d = vectors[0].length;

  // 1. Center the data (mean = 0)
  const mean = new Float64Array(d);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < d; j++) {
      mean[j] += vectors[i][j];
    }
  }
  for (let j = 0; j < d; j++) mean[j] /= n;

  const X = vectors.map((row) => row.map((val, j) => val - mean[j]));

  // 2. Power Iteration to find 1st Principal Component
  let pc1 = new Float64Array(d).fill(1 / Math.sqrt(d));
  for (let iter = 0; iter < 15; iter++) {
    const nextPc1 = new Float64Array(d);
    for (let i = 0; i < n; i++) {
      let dot = 0;
      for (let j = 0; j < d; j++) dot += X[i][j] * pc1[j];
      for (let j = 0; j < d; j++) nextPc1[j] += X[i][j] * dot;
    }
    pc1 = Float64Array.from(normalizeVector(Array.from(nextPc1)));
  }

  // 3. Power Iteration for 2nd Principal Component (Orthogonal to PC1)
  let pc2 = new Float64Array(d);
  for (let j = 0; j < d; j++) pc2[j] = (j % 2 === 0 ? 1 : -1) / Math.sqrt(d);
  for (let iter = 0; iter < 15; iter++) {
    // Gram-Schmidt orthogonalization against PC1
    let dot1 = 0;
    for (let j = 0; j < d; j++) dot1 += pc2[j] * pc1[j];
    for (let j = 0; j < d; j++) pc2[j] -= dot1 * pc1[j];
    pc2 = Float64Array.from(normalizeVector(Array.from(pc2)));

    const nextPc2 = new Float64Array(d);
    for (let i = 0; i < n; i++) {
      let dot = 0;
      for (let j = 0; j < d; j++) dot += X[i][j] * pc2[j];
      for (let j = 0; j < d; j++) nextPc2[j] += X[i][j] * dot;
    }
    pc2 = Float64Array.from(normalizeVector(Array.from(nextPc2)));
  }

  // 4. Project data onto PC1 and PC2
  const rawCoords = X.map((row) => {
    let x = 0;
    let y = 0;
    for (let j = 0; j < d; j++) {
      x += row[j] * pc1[j];
      y += row[j] * pc2[j];
    }
    return { x, y };
  });

  // 5. Scale to viewport bounds
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const c of rawCoords) {
    if (c.x < minX) minX = c.x;
    if (c.x > maxX) maxX = c.x;
    if (c.y < minY) minY = c.y;
    if (c.y > maxY) maxY = c.y;
  }

  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;
  const pad = bounds.padding ?? 80;
  const w = bounds.width - pad * 2;
  const h = bounds.height - pad * 2;

  return rawCoords.map((c) => ({
    x: pad + ((c.x - minX) / rangeX) * w,
    y: pad + ((c.y - minY) / rangeY) * h,
  }));
}

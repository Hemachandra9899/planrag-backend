// src/services/embeddingService.js
import { pipeline } from "@xenova/transformers";

let embedderPromise = null;

// Lazy-init so it only loads once, on first call
const getEmbedder = async () => {
  if (!embedderPromise) {
    embedderPromise = pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2" // free local model
    );
  }
  return embedderPromise;
};

// Main embedding function you use everywhere
export const getFreeEmbedding = async (text) => {
  const embedder = await getEmbedder();

  // ✅ Defensive: never pass null/undefined to the tokenizer
  const safeText = (text ?? "").toString();

  if (!safeText.trim()) {
    // Either return a zero-vector or throw; for FIND it'd be better to bail.
    // Here we'll throw so you see if something is wrong upstream.
    throw new Error("getFreeEmbedding: text is empty or missing");
  }

  const output = await embedder(safeText, {
    pooling: "mean",    // average over tokens
    normalize: true     // unit-normalize (good for cosine)
  });

  // output.data is a TypedArray of length 384
  return Array.from(output.data);
};

// src/services/ingestionService.js
import { saveChunks } from './indexService.js';

export const ingestDocument = async ({ orgId, tenantId, docId, title, text, metadata }) => {
  const rawChunks = splitIntoChunks(text);

  const chunks = rawChunks.map((chunkText, i) => ({
    orgId,
    tenantId,
    chunkId: `${docId}:chunk_${i + 1}`,
    docId,
    title,
    text: chunkText,
    metadata: {
      ...(metadata || {}),
      chunkIndex: i + 1
    }
    // embedding: you can add later
  }));

  saveChunks(orgId, tenantId, chunks);
};

const splitIntoChunks = (text) => {
  if (!text) return [];
  const parts = text
    .split(/\n\s*\n/)       // split on blank lines
    .map(p => p.trim())
    .filter(Boolean);

  return parts.length ? parts : [text];
};

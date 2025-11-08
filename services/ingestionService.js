// src/services/ingestionService.js
import { saveChunks } from "./indexService.js";

/**
 * Simple helper: normalize whitespace a bit
 */
const normalizeText = (text) => {
  if (!text) return "";
  return text
    .toString()
    .replace(/\r\n/g, "\n")     // Windows → Unix newlines
    .replace(/\t/g, " ")        // tabs → spaces
    .replace(/\u00a0/g, " ")    // non-breaking spaces → spaces
    .replace(/\n{3,}/g, "\n\n") // collapse 3+ newlines into 2
    .trim();
};

/**
 * Split long text into reasonably sized chunks.
 * This is a very simple chunker:
 * - split by paragraphs
 * - then pack paragraphs into chunks up to ~1200 chars
 */
const MAX_CHUNK_CHARS = 1200;

const splitTextIntoChunks = (text) => {
  const chunks = [];
  const paragraphs = text.split(/\n{2,}/); // split on blank lines

  let current = "";

  for (const paraRaw of paragraphs) {
    const para = paraRaw.trim();
    if (!para) continue;

    // If paragraph itself is huge, hard-split it
    if (para.length > MAX_CHUNK_CHARS) {
      let start = 0;
      while (start < para.length) {
        const slice = para.slice(start, start + MAX_CHUNK_CHARS);
        if (current) {
          chunks.push(current);
          current = "";
        }
        chunks.push(slice);
        start += MAX_CHUNK_CHARS;
      }
      continue;
    }

    // If adding this paragraph would overflow current chunk, push and start new
    const candidate = current
      ? current + "\n\n" + para
      : para;

    if (candidate.length > MAX_CHUNK_CHARS) {
      if (current) {
        chunks.push(current);
      }
      current = para;
    } else {
      current = candidate;
    }
  }

  if (current) {
    chunks.push(current);
  }

  return chunks;
};

/**
 * Main ingestion entry point.
 *
 * Called from ingestController with:
 * {
 *   orgId,
 *   tenantId,
 *   docId,
 *   title,
 *   text,
 *   metadata
 * }
 *
 * It:
 *  1) normalizes + chunks the text
 *  2) builds chunk objects (with chunkId, text, metadata, etc.)
 *  3) passes them to saveChunks → Pinecone
 */
export const ingestDocument = async ({
  orgId,
  tenantId,
  docId,
  title,
  text,
  metadata = {},
}) => {
  const cleanText = normalizeText(text);

  if (!cleanText) {
    console.warn("ingestDocument: empty text, skipping.");
    return;
  }

  const safeDocId = docId || `doc_${Date.now().toString(36)}`;
  const safeTitle = title || "Untitled document";

  const chunkTexts = splitTextIntoChunks(cleanText);

  if (!chunkTexts.length) {
    console.warn("ingestDocument: no chunks produced, skipping.");
    return;
  }

  const chunks = chunkTexts.map((chunkText, i) => ({
    chunkId: `${safeDocId}:chunk_${i}`,
    docId: safeDocId,
    title: safeTitle,
    text: chunkText,
    metadata: {
      ...metadata,
      chunk_index: i,
    },
  }));

  console.log(
    `ingestDocument: org=${orgId}, tenant=${tenantId}, doc=${safeDocId}, chunks=${chunks.length}`
  );

  await saveChunks(orgId, tenantId, chunks);
};

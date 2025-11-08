// src/services/indexService.js
import { getNamespaceIndex } from "../utils/pineconeClient.js";
import { getFreeEmbedding } from "./embeddingService.js";

/**
 * Save chunks for a given org/tenant into Pinecone.
 * chunks: [{ chunkId, text, metadata, docId, title, ... }]
 */
// src/services/indexService.js


/**
 * Save chunks for a given org/tenant into Pinecone.
 * chunks: [{ chunkId, text, metadata, docId, title, ... }]
 */
export const saveChunks = async (orgId, tenantId, chunks) => {
  if (!chunks || !chunks.length) {
    console.log("saveChunks: no chunks to save");
    return;
  }

  console.log(
    `saveChunks: org=${orgId}, tenant=${tenantId}, chunks=${chunks.length}`
  );

  const index = getNamespaceIndex(orgId, tenantId);
  const records = [];

  for (const chunk of chunks) {
    if (!chunk.text || !chunk.text.trim()) continue;

    let embedding;
    try {
      embedding = await getFreeEmbedding(chunk.text);
    } catch (err) {
      console.error("❌ Embedding error for chunk", chunk.chunkId, err);
      continue;
    }

    if (!embedding || !embedding.length) {
      console.warn(
        "⚠️ Empty embedding for chunk",
        chunk.chunkId,
        "skipping..."
      );
      continue;
    }

    records.push({
      id: chunk.chunkId,
      values: embedding, // 384-d array
      metadata: {
        org_id: orgId,
        tenant_id: tenantId,
        doc_id: chunk.docId,
        title: chunk.title,
        text: chunk.text,
        ...(chunk.metadata || {})
      }
    });
  }

  if (!records.length) {
    console.log("saveChunks: no valid records to upsert");
    return;
  }

  console.log(
    `saveChunks: upserting ${records.length} records to namespace ${orgId}__${tenantId}`
  );

  try {
    const upsertRes = await index.upsert(records);
    console.log("✅ Pinecone upsert response:", upsertRes);
  } catch (err) {
    console.error("❌ Pinecone upsert error:", err);
  }
};


/**
 * Semantic FIND over Pinecone for this org/tenant.
 */
export const findChunks = async (orgId, tenantId, query, filterParams = {}) => {
  const index = getNamespaceIndex(orgId, tenantId);
  const vector = await getFreeEmbedding(query);

  const filter = buildMetadataFilter(filterParams);

  const res = await index.query({
    vector,
    topK: filterParams.topK || 20,
    includeMetadata: true,
    filter: Object.keys(filter).length ? filter : undefined
  });

  const matches = res.matches || [];

  return matches.map((m) => ({
    orgId,
    tenantId,
    chunkId: m.id,
    docId: m.metadata?.doc_id,
    title: m.metadata?.title,
    text: m.metadata?.text,
    metadata: m.metadata || {},
    score: m.score
  }));
};

const buildMetadataFilter = (params) => {
  const filter = {};
  if (params.service_name) filter.service_name = { $eq: params.service_name };
  if (params.region) filter.region = { $eq: params.region };
  if (params.doc_types && Array.isArray(params.doc_types)) {
    filter.doc_type = { $in: params.doc_types };
  }
  return filter;
};

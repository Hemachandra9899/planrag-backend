// src/models/chunkModel.js

/**
 * Chunk represents one searchable piece of a document.
 * It always knows which document and org/tenant it belongs to.
 */
export class Chunk {
    constructor({
      orgId,
      tenantId,
      chunkId,
      docId,
      title,
      text,
      metadata = {},
      embedding = null
    }) {
      this.orgId = orgId;
      this.tenantId = tenantId;
      this.chunkId = chunkId;
      this.docId = docId;
      this.title = title;
      this.text = text;
      this.metadata = metadata;   // service_name, doc_type, region, etc.
      this.embedding = embedding; // placeholder for later if you add vectors
    }
  }
  
  /**
   * Helper for building a chunk from raw params.
   */
  export const createChunk = ({
    orgId,
    tenantId,
    docId,
    title,
    chunkIndex,
    text,
    metadata = {},
    embedding = null
  }) => {
    const chunkId = `${docId}:chunk_${chunkIndex}`;
    return new Chunk({
      orgId,
      tenantId,
      chunkId,
      docId,
      title,
      text,
      metadata: {
        ...metadata,
        chunkIndex
      },
      embedding
    });
  };
  
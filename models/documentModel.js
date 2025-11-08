// src/models/documentModel.js

/**
 * Document represents a single logical doc BEFORE it is split into chunks.
 * (e.g. a runbook, incident report, SLO doc, etc.)
 */
export class Document {
    constructor({ orgId, tenantId, docId, title, text, metadata = {} }) {
      this.orgId = orgId;
      this.tenantId = tenantId;
      this.docId = docId;
      this.title = title;
      this.text = text;
      this.metadata = metadata; // { service_name, doc_type, region, created_at, ... }
    }
  }
  
  /**
   * Optional helper: build a Document from an /ingest request body.
   */
  export const createDocumentFromRequest = (orgId, body) => {
    const {
      tenant_id,
      doc_id,
      title,
      text,
      metadata
    } = body;
  
    return new Document({
      orgId,
      tenantId: tenant_id,
      docId: doc_id,
      title,
      text,
      metadata: metadata || {}
    });
  };
  
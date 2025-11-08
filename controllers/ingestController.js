// src/controllers/ingestController.js
import { ingestDocument } from "../services/ingestionService.js";

const DEMO_API_KEY = "prg_live_skyscale_demo";
const DEMO_ORG_ID = "org_skyscale_demo";

const parseTags = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    return raw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return [];
};

export const ingestDocuments = async (req, res) => {
  try {
    const apiKey = req.headers["x-api-key"];

    // Simple demo auth
    if (apiKey !== DEMO_API_KEY) {
      return res.status(401).json({ error: "Invalid API key" });
    }

    const orgId = DEMO_ORG_ID;

    // Expect JSON only
    const {
      tenant_id,
      service_name,
      region,
      doc_id,
      title,
      text,
      metadata,
      document,
    } = req.body;

    if (!tenant_id) {
      return res.status(400).json({ error: "tenant_id is required" });
    }

    let finalTitle = title || "Untitled document";
    let finalDocId = doc_id || null;
    let finalText = text || "";
    let finalMetadata = metadata || {};
    let tags = [];
    let originalFilename;

    // New shape: { tenant_id, service_name, region, document: {...} }
    if (document) {
      const {
        title: docTitle,
        content,
        tags: docTags,
        original_filename,
      } = document;

      if (docTitle) finalTitle = docTitle;
      if (content) finalText = content;

      tags = parseTags(docTags);
      originalFilename = original_filename;
    }

    // If using legacy shape, tags can also come as top-level metadata.tags or req.body.tags
    if (!tags.length && metadata && metadata.tags) {
      tags = parseTags(metadata.tags);
    }
    if (!tags.length && req.body.tags) {
      tags = parseTags(req.body.tags);
    }

    if (!finalDocId) {
      const base = service_name || "doc";
      finalDocId = `${base}_${Date.now().toString(36)}`;
    }

    if (!finalText || !finalText.trim()) {
      return res
        .status(400)
        .json({ error: "tenant_id and non-empty text/content are required" });
    }

    finalMetadata = {
      ...finalMetadata,
      service_name,
      region,
      doc_type: "runbook", // or "doc"/"note" if you want
      tags,
      original_filename: originalFilename,
    };

    await ingestDocument({
      orgId,
      tenantId: tenant_id,
      docId: finalDocId,
      title: finalTitle,
      text: finalText,
      metadata: finalMetadata,
    });

    return res.json({ status: "ok", doc_id: finalDocId });
  } catch (err) {
    console.error("Ingest error", err);
    return res.status(500).json({ error: "Internal error in ingest" });
  }
};

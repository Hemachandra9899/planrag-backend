// src/controllers/ingestController.js
import { getOrgIdFromApiKey } from '../services/authService.js';
import { ingestDocument } from '../services/ingestionService.js';

export const ingestDocuments = async (req, res) => {
  try {
    const apiKey = req.headers['x-api-key'];
    const orgId = getOrgIdFromApiKey(apiKey);

    if (!orgId) {
      return res.status(401).json({ error: 'Invalid API key' });
    }
    

    const { tenant_id, doc_id, title, text, metadata } = req.body;

    await ingestDocument({
      orgId,
      tenantId: tenant_id,
      docId: doc_id,
      title,
      text,
      metadata
    });

    res.json({ status: 'ok' });
  } catch (err) {
    console.error('Ingest error', err);
    res.status(500).json({ error: 'Internal error in ingest' });
  }
};

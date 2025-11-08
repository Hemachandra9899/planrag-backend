// src/services/executionService.js
import { findChunks } from './indexService.js';

export const executePlan = async ({ orgId, tenantId, question, plan }) => {
  const stepResults = {};

  for (const step of plan) {
    if (step.type === 'FIND') {
      const { query, service_name, region, doc_types } = step.params || {};

      // ✅ Fallback: if plan didn't set query, use user question
      let q = query && query.trim ? query.trim() : "";
      if (!q && question) {
        q = question.toString().trim();
      }

      // If still empty, don't even call Pinecone
      if (!q) {
        console.warn("FIND step: empty query, returning []");
        stepResults[step.id] = [];
        continue;
      }

      const found = await findChunks(orgId, tenantId, q, {
        service_name,
        region,
        doc_types,
        topK: 6,
      });

      stepResults[step.id] = found;

    } else if (step.type === 'FILTER') {
      const prev = stepResults[step.inputs[0]] || [];
      const inputChunks = Array.isArray(prev) ? prev : [];

      const filteredList = filterChunks(inputChunks, step.params || {});
      // (optional) if you still want to keep only one best chunk:
      // const topOne = filteredList.length ? [filteredList[0]] : [];
      // stepResults[step.id] = topOne;
      stepResults[step.id] = filteredList;

    } else if (step.type === 'JOIN') {
      const prev = stepResults[step.inputs[0]] || [];
      const inputChunks = Array.isArray(prev) ? prev : [];

      const bundle = joinChunksIntoFacts(inputChunks);
      stepResults[step.id] = bundle;

    } else if (step.type === 'VERIFY') {
      const inputBundle = stepResults[step.inputs[0]] || {};
      const verified = verifyFacts(inputBundle);
      stepResults[step.id] = verified;
    }
  }

  return { stepResults };
};

const filterChunks = (chunks, params) => {
  const { service_name, region, doc_types } = params;
  return chunks.filter(chunk => {
    const m = chunk.metadata || {};
    if (service_name && m.service_name && m.service_name !== service_name) return false;
    if (region && m.region && m.region !== region) return false;
    if (doc_types && m.doc_type && !doc_types.includes(m.doc_type)) return false;
    return true;
  });
};

const joinChunksIntoFacts = (chunks) => {
  const result = {
    runbooks: [],
    incidents: [],
    slos: [],
    architecture: []
  };

  for (const chunk of chunks) {
    const type = (chunk.metadata && chunk.metadata.doc_type) || 'other';
    if (type === 'runbook') result.runbooks.push(chunk);
    else if (type === 'incident') result.incidents.push(chunk);
    else if (type === 'slo') result.slos.push(chunk);
    else if (type === 'architecture') result.architecture.push(chunk);
  }

  return result;
};

const verifyFacts = (bundle) => {
  return {
    runbooks: bundle?.runbooks || [],
    incidents: bundle?.incidents || [],
    slos: bundle?.slos || [],
    architecture: bundle?.architecture || [],
  };
};

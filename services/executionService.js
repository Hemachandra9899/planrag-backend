// src/services/executionService.js
import { findChunks } from './indexService.js';

export const executePlan = async ({ orgId, tenantId, question, plan }) => {
  const stepResults = {};

  for (const step of plan) {
    if (step.type === 'FIND') {
        const found = findChunks(orgId, tenantId, step.params.query);
      stepResults[step.id] = found;

    } else if (step.type === 'FILTER') {
      const inputChunks = stepResults[step.inputs[0]] || [];
      const filtered = filterChunks(inputChunks, step.params);
      stepResults[step.id] = filtered;

    } else if (step.type === 'JOIN') {
      const inputChunks = stepResults[step.inputs[0]] || [];
      const bundle = joinChunksIntoFacts(inputChunks);
      stepResults[step.id] = bundle;

    } else if (step.type === 'VERIFY') {
      const inputBundle = stepResults[step.inputs[0]];
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

// Very simple "verification" for hack
const verifyFacts = (bundle) => {
  return {
    runbooks: bundle?.runbooks || [],
    incidents: bundle?.incidents || [],
    slos: bundle?.slos || [],
    architecture: bundle?.architecture || [],
    // could add simple heuristics here
  };
};

// src/services/indexService.js

// { orgId: { tenantId: [chunk, chunk, ...] } }
const index = {};

export const saveChunks = (orgId, tenantId, chunks) => {
  if (!index[orgId]) index[orgId] = {};
  if (!index[orgId][tenantId]) index[orgId][tenantId] = [];
  index[orgId][tenantId].push(...chunks);
};

export const getChunks = (orgId, tenantId) => {
  return (index[orgId] && index[orgId][tenantId]) ? index[orgId][tenantId] : [];
};

// indexService.js
export const findChunks = (orgId, tenantId, query) => {
    const allChunks = getChunks(orgId, tenantId);
    const q = (query || '').toLowerCase();
  
    // Extract some words from question
    const tokens = q.split(/\W+/).filter(Boolean);
  
    return allChunks.filter(chunk => {
      const text = chunk.text.toLowerCase();
      // Match if ANY token appears in the chunk
      return tokens.some(token => text.includes(token));
    });
  };

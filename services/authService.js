// src/services/authService.js

// For hackathon: one demo API key → one org
const apiKeyToOrg = {
    'prg_live_skyscale_demo': 'org_skyscale_001'
  };
  
  export const getOrgIdFromApiKey = (apiKey) => {
    if (!apiKey) return null;
    return apiKeyToOrg[apiKey] || null;
  };
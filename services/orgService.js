// src/services/orgService.js
import crypto from "crypto";

// In-memory stores (reset when server restarts — ok for demo)
const orgs = new Map();        // orgId -> { orgName, email, createdAt }
const apiKeyToOrg = new Map(); // apiKey -> orgId

const randomId = (prefix) =>
  `${prefix}_${crypto.randomBytes(6).toString("hex")}`;

// Register a new org + API key
export const registerOrg = ({ email, password, orgName }) => {
  // For hackathon: we won't actually validate password, just store fields
  const orgId = randomId("org");
  const apiKey = `prg_live_${crypto.randomBytes(16).toString("hex")}`;

  orgs.set(orgId, {
    orgId,
    orgName,
    email,
    createdAt: new Date().toISOString()
  });

  apiKeyToOrg.set(apiKey, orgId);

  return { orgId, apiKey };
};

// Used by authService
export const getOrgIdForApiKey = (apiKey) => {
  if (!apiKey) return null;
  return apiKeyToOrg.get(apiKey) || null;
};

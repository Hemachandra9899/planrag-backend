// src/utils/pineconeClient.js
import { Pinecone } from "@pinecone-database/pinecone";
import dotenv from "dotenv";
dotenv.config();

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY
});

// Base index (must already exist in Pinecone with dim=384)
const baseIndex = pinecone.index("planrag");

// Namespace helper: org + tenant
export const getNamespaceIndex = (orgId, tenantId) => {
  const ns = `${orgId}__${tenantId}`;
  return baseIndex.namespace(ns);
};

export const initPinecone = async () => {
  try {
    const stats = await baseIndex.describeIndexStats();
    console.log("✅ Pinecone index ready:", stats);
  } catch (err) {
    console.error("❌ Error initializing Pinecone:", err);
    throw err;
  }
};

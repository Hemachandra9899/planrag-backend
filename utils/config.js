// src/utils/config.js
import dotenv from 'dotenv';

dotenv.config();

/**
 * Central config object for the backend.
 * You can import this anywhere instead of calling process.env directly.
 */
export const config = {
  port: process.env.PORT || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // For hackathon: one demo API key; you can also move this into env
  demoApiKey: process.env.PLANRAG_API_KEY || 'prg_live_skyscale_demo',

  // If you later add embeddings / LLM, put keys here:
  // openaiApiKey: process.env.OPENAI_API_KEY,
  // etc.
};


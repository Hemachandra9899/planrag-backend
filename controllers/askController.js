// src/controllers/askController.js
import { buildPlan } from "../services/planService.js";
import { executePlan } from "../services/executionService.js";
import { buildAnswer } from "../services/answerService.js";

// 🔒 Hardcoded demo auth (no DB, no orgService)
const DEMO_API_KEY = "prg_live_skyscale_demo";
const DEMO_ORG_ID = "org_skyscale_demo";

export const handleQuestion = async (req, res) => {
  try {
    const apiKey = req.headers["x-api-key"];

    // Optional: simple API key check
    if (apiKey !== DEMO_API_KEY) {
      return res.status(401).json({ error: "Invalid API key" });
    }

    // All requests use the same demo org
    const orgId = DEMO_ORG_ID;

    const { tenant_id, question, context } = req.body;

    if (!tenant_id || !question) {
      return res
        .status(400)
        .json({ error: "tenant_id and question are required" });
    }

    // 1) Build plan
    const plan = buildPlan({ question, context });

    // 2) Execute plan (FIND → FILTER → JOIN → VERIFY)
    const execResult = await executePlan({
      orgId,
      tenantId: tenant_id,
      question,
      plan,
    });

    // 3) Build final answer (uses Groq or your current implementation)
    const answer = await buildAnswer({
      question,
      plan,
      execResult,
    });

    res.json(answer);
  } catch (err) {
    console.error("Ask error", err);
    res.status(500).json({ error: "Internal error in ask" });
  }
};

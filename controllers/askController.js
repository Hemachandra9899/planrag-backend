// src/controllers/askController.js
import { getOrgIdFromApiKey } from '../services/authService.js';
import { buildPlan } from '../services/planService.js';
import { executePlan } from '../services/executionService.js';
import { buildAnswer } from '../services/answerService.js';

export const handleQuestion = async (req, res) => {
  try {
    const apiKey = req.headers['x-api-key'];
    const orgId = getOrgIdFromApiKey(apiKey);

    if (!orgId) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    const { tenant_id, question, context } = req.body;

    // 1) Build plan
    const plan = buildPlan({ question, context });

    // 2) Execute plan
    const execResult = await executePlan({
      orgId,
      tenantId: tenant_id,
      question,
      plan
    });

    // 3) Build final answer
    const answer = buildAnswer({
      question,
      plan,
      execResult
    });

    res.json(answer);
  } catch (err) {
    console.error('Ask error', err);
    res.status(500).json({ error: 'Internal error in ask' });
  }
};

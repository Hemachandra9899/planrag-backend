// src/services/llmService.js
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY, // reads from .env
});

// question: string
// evidenceChunks: array of chunk objects from Pinecone (docId, text, metadata...)
export const summarizeAnswerWithGroq = async ({ question, evidenceChunks }) => {
  const chunks = Array.isArray(evidenceChunks) ? evidenceChunks : [];
  const topChunks = chunks.slice(0, 5); // don't blow up context

  const context = topChunks
    .map((chunk, i) => {
      const label = `[#${i + 1} | ${chunk.docId} | ${
        chunk.metadata?.doc_type || "doc"
      }]`;
      return `${label}\n${chunk.text}`;
    })
    .join("\n\n");

  const userPrompt = `
User question:
${question}

You are given snippets from internal docs (runbooks, incidents, SLOs, architecture).
Use ONLY these docs to answer.

Docs:
${context}

Instructions:
- First, infer the most likely cause or diagnosis (if relevant).
- Then give a short, ordered list of concrete steps (1., 2., 3., ...).
- Stay concise (max 6–8 bullet points / steps).
- If something is uncertain or not covered, say so explicitly.
- Do NOT invent tools/metrics not mentioned in the docs.
`;

  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      {
        role: "system",
        content:
          "You are PlanRAG, a careful on-call assistant. Only use the provided docs as ground truth.",
      },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.5,
  });

  const content =
    completion.choices?.[0]?.message?.content?.trim() ||
    "Sorry, I couldn’t generate an answer.";

  // Simple heuristic: more docs → more confidence
  const confidence = Math.min(1, 0.5 + topChunks.length * 0.05);

  return { answerText: content, confidence };
};

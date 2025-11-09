// src/services/llmService.js
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY, // reads from .env
});

// Simple helper: detect greetings / small-talk we don't need an LLM for
const isGreeting = (rawQuestion) => {
  if (!rawQuestion) return true;
  const q = rawQuestion.toLowerCase().trim().replace(/[!?.,]/g, "");

  const greetings = [
    "hi",
    "hii",
    "hello",
    "hey",
    "hey there",
    "yo",
    "sup",
    "good morning",
    "good evening",
    "good afternoon",
  ];

  if (greetings.includes(q)) return true;
  if (q.startsWith("hi ") || q.startsWith("hello ") || q.startsWith("hey ")) {
    return true;
  }
  if (
    q.includes("how are you") ||
    q.includes("whats up") ||
    q.includes("what's up")
  ) {
    return true;
  }

  return false;
};

// question: string
// evidenceChunks: array of chunk objects from Pinecone (docId, text, metadata...)
export const summarizeAnswerWithGroq = async ({ question, evidenceChunks }) => {
  const q = (question || "").trim();

  // 1) Handle greetings / very small talk without LLM
  if (!q || isGreeting(q)) {
    return {
      answerText:
        "Hi, I’m your PlanRAG copilot for your internal docs. How can I help you today?",
      confidence: 0.99,
    };
  }

  // 2) Normalize & cap evidence
  const chunks = Array.isArray(evidenceChunks) ? evidenceChunks : [];
  const topChunks = chunks
    .filter((c) => c && typeof c.text === "string" && c.text.trim().length > 0)
    .slice(0, 5); // don’t blow up context

  // If we somehow have no usable docs, be honest
  if (!topChunks.length) {
    return {
      answerText:
        "I couldn’t find any relevant documentation for this question in the current tenant. Try ingesting runbooks or docs, or broaden your question.",
      confidence: 0.2,
    };
  }

  const context = topChunks
    .map((chunk, i) => {
      const label = `#${i + 1}`;
      const id = chunk.docId || chunk.metadata?.doc_id || "doc";
      const type = chunk.metadata?.doc_type || "doc";
      return `[${label} | ${id} | ${type}]\n${chunk.text}`;
    })
    .join("\n\n");

  const userPrompt = `
You are helping an on-call engineer. Use ONLY the internal docs below to answer.

QUESTION:
${q}

DOC SNIPPETS:
${context}

You MUST respond in the following exact structure and order:

ANSWER:
- A direct, concise answer to the question in 2–4 sentences.
- Do NOT start with any preamble like "Based on the docs" or "Here is the answer".
- Assume the reader is already in an incident channel.

NEXT STEPS:
1. Short, concrete action the on-call should take first.
2. Next action.
3. Additional steps (up to 6–8 in total).
- Each step should be specific and operational (check X dashboard, compare Y/Z, roll back, escalate, etc.).
- If the docs are incomplete or conflicting, include a step that says what additional data is needed.

EVIDENCE:
- Bullet list of which snippets you used, with a short justification.
- Use the snippet labels like [#1], [#2], etc.
- Example:
  - [#1] latency runbook for checkout in us-east-1 (triage checklist)
  - [#3] postmortem describing DB connection pool exhaustion pattern

Additional rules:
- Use ONLY the information in the snippets above. Do NOT use outside knowledge.
- If the docs do NOT cover the question, say that clearly in ANSWER and in NEXT STEPS suggest what extra docs/metrics are needed.
- Prefer concrete, actionable steps over vague advice.
`;

  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      {
        role: "system",
        content:
          "You are PlanRAG, a precise on-call assistant. You MUST base your answer only on the provided documentation snippets and MUST follow the required output format with sections ANSWER, NEXT STEPS, and EVIDENCE, in that order.",
      },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.2, // lower = more deterministic / structured
  });

  const content =
    completion.choices?.[0]?.message?.content?.trim() ||
    "Sorry, I couldn’t generate an answer from the available documentation.";

  // Simple heuristic: more docs used → higher confidence (but capped at 1.0)
  const confidence = Math.min(1, 0.5 + topChunks.length * 0.08);

  return { answerText: content, confidence };
};

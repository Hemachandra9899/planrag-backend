// src/services/answerService.js
import { summarizeAnswerWithGroq } from "./llmService.js";

const collectEvidenceChunks = (bundle) => [
  ...(bundle?.runbooks || []),
  ...(bundle?.incidents || []),
  ...(bundle?.slos || []),
  ...(bundle?.architecture || []),
];

const buildEvidenceList = (chunks) =>
  chunks.slice(0, 5).map((chunk) => ({
    doc_id: chunk.docId,
    title: chunk.title,
    doc_type: chunk.metadata?.doc_type,
    service_name: chunk.metadata?.service_name,
    snippet: chunk.text.slice(0, 220),
    // 🔗 proof link:
    link:
      chunk.metadata?.source_url ||
      chunk.metadata?.source_path ||
      null,
    metadata: chunk.metadata,
  }));

export const buildAnswer = async ({ question, plan, execResult }) => {
  const { stepResults } = execResult;


  const findStep = plan.find((s) => s.type === "FIND");
  const filterStep = plan.find((s) => s.type === "FILTER");
  const joinStep = plan.find((s) => s.type === "JOIN");
  const verifyStep = plan.find((s) => s.type === "VERIFY");

  const s1 = findStep ? stepResults[findStep.id] || [] : [];
  const s2 = filterStep ? stepResults[filterStep.id] || [] : [];
  const s3 = joinStep ? stepResults[joinStep.id] || null : null;
  const s4 = verifyStep ? stepResults[verifyStep.id] || null : null;

  // bundle from JOIN/VERIFY: { runbooks, incidents, slos, architecture }
  const bundle =
    s4 ||
    s3 || {
      runbooks: [],
      incidents: [],
      slos: [],
      architecture: [],
    };

  const allChunks = collectEvidenceChunks(bundle);
  const evidence = buildEvidenceList(allChunks);

  // 🔥 Call Groq here to summarize using the evidence
  const { answerText, confidence } = await summarizeAnswerWithGroq({
    question,
    evidenceChunks: allChunks,
  });

  const plan_trace = [
    {
      step: "FIND",
      input_size: null,
      output_size: Array.isArray(s1) ? s1.length : 0,
    },
    {
      step: "FILTER",
      input_size: Array.isArray(s1) ? s1.length : 0,
      output_size: Array.isArray(s2) ? s2.length : 0,
    },
    {
      step: "JOIN",
      input_size: Array.isArray(s2) ? s2.length : 0,
      output_size: Array.isArray(s2) ? s2.length : 0,
    },
    {
      step: "VERIFY",
      input_size: Array.isArray(s2) ? s2.length : 0,
      output_size: evidence.length,
    },
  ];

  return {
    answer: answerText,
    confidence,
    plan_trace,
    evidence,
  };
};

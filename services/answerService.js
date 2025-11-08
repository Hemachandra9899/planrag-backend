// src/services/answerService.js

export const buildAnswer = ({ question, plan, execResult }) => {
    const { stepResults } = execResult;
  
    const findStep = plan.find(s => s.type === 'FIND');
    const filterStep = plan.find(s => s.type === 'FILTER');
    const joinStep = plan.find(s => s.type === 'JOIN');
    const verifyStep = plan.find(s => s.type === 'VERIFY');
  
    const s1 = findStep ? stepResults[findStep.id] : [];
    const s2 = filterStep ? stepResults[filterStep.id] : [];
    const s3 = joinStep ? stepResults[joinStep.id] : null;
    const s4 = verifyStep ? stepResults[verifyStep.id] : null;
  
    const { textAnswer, confidence, evidence } = buildNaiveOncallAnswer(question, s3, s4);
  
    const plan_trace = [
      { step: 'FIND',   input_size: null,      output_size: s1 ? s1.length : 0 },
      { step: 'FILTER', input_size: s1.length, output_size: s2 ? s2.length : 0 },
      { step: 'JOIN',   input_size: s2.length, output_size: s3 ? s2.length : 0 },
      { step: 'VERIFY', input_size: s2.length, output_size: evidence.length }
    ];
  
    return {
      answer: textAnswer,
      confidence,
      plan_trace,
      evidence
    };
  };
  
  const buildNaiveOncallAnswer = (question, bundle, verified) => {
    const evidenceChunks = [
      ...(bundle?.runbooks || []),
      ...(bundle?.incidents || []),
      ...(bundle?.slos || [])
    ].slice(0, 5);
  
    const textAnswer =
      'Based on your runbooks, SLOs and past incidents, the most likely cause is related to the dependencies mentioned in the incident docs (for example Redis or the database). ' +
      'First, follow the documented runbook steps (check pods → Redis → DB), and then apply the mitigations that worked in the most similar past incident.';
  
    const evidence = evidenceChunks.map(chunk => ({
      doc_id: chunk.docId,
      title: chunk.title,
      doc_type: chunk.metadata?.doc_type,
      service_name: chunk.metadata?.service_name,
      snippet: chunk.text.slice(0, 220),
      metadata: chunk.metadata
    }));
  
    return {
      textAnswer,
      confidence: 0.8,
      evidence
    };
  };
  
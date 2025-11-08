// src/services/planService.js

export const buildPlan = ({ question, context = {} }) => {
    const serviceName = context.service_name || guessServiceFromQuestion(question);
    const region = context.region || guessRegionFromQuestion(question);
  
    return [
      {
        id: 's1',
        type: 'FIND',
        params: {
          query: question,
          service_name: serviceName
        }
      },
      {
        id: 's2',
        type: 'FILTER',
        inputs: ['s1'],
        params: {
          service_name: serviceName,
          region: region,
          doc_types: ['runbook', 'incident', 'slo', 'architecture']
        }
      },
      {
        id: 's3',
        type: 'JOIN',
        inputs: ['s2'],
        params: {
          group_by: 'service_name'
        }
      },
      {
        id: 's4',
        type: 'VERIFY',
        inputs: ['s3'],
        params: {}
      }
    ];
  };
  
  const guessServiceFromQuestion = (q = '') => {
    const text = q.toLowerCase();
    if (text.includes('checkout')) return 'checkout';
    if (text.includes('search')) return 'search';
    if (text.includes('payment')) return 'payments';
    return null;
  };
  
  const guessRegionFromQuestion = (q = '') => {
    const text = q.toLowerCase();
    if (text.includes('eu-west-1')) return 'eu-west-1';
    if (text.includes('us-east-1')) return 'us-east-1';
    return null;
  };
  
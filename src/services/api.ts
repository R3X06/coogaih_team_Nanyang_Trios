import type { MicroCheckQuiz } from '@/types/session';

// These are meant to be replaced with real backend HTTP calls.
// For the hackathon MVP, they return mock data.

const API_BASE = '/api'; // editable endpoint base

export async function generateQuiz(topics: string[], keyPoints: string[]): Promise<MicroCheckQuiz> {
  // In production: fetch(`${API_BASE}/generate-quiz`, { method: 'POST', body: JSON.stringify({ topics, keyPoints }) })
  
  const questions = [
    {
      id: '1',
      question: `Which concept is most central to ${topics[0] || 'this topic'}?`,
      options: ['Fundamental principles', 'Advanced theorems', 'Practical applications', 'Historical context'],
      correctAnswer: 0,
    },
    {
      id: '2',
      question: 'What is the primary benefit of spaced repetition?',
      options: ['Faster reading', 'Better long-term retention', 'Improved note-taking', 'Reduced study time'],
      correctAnswer: 1,
    },
    {
      id: '3',
      question: 'Active recall is most effective when combined with:',
      options: ['Passive review', 'Interleaved practice', 'Highlighting text', 'Re-reading notes'],
      correctAnswer: 1,
    },
    {
      id: '4',
      question: `A key confusion area was identified. What should you prioritize?`,
      options: ['Skip it for now', 'Review foundational concepts', 'Move to advanced topics', 'Ask a peer'],
      correctAnswer: 1,
    },
    {
      id: '5',
      question: 'Metacognitive monitoring helps with:',
      options: ['Speed reading', 'Self-assessment accuracy', 'Memorization tricks', 'Test anxiety'],
      correctAnswer: 1,
    },
  ].slice(0, Math.min(5, Math.max(3, topics.length + 2)));

  return { questions };
}

export async function analyzeSession(telemetry: any[], debrief: any) {
  // In production: fetch(`${API_BASE}/analyze-session`, { method: 'POST', body: ... })
  return {
    attentionScore: 7.5,
    focusDropPoints: [12, 28],
    suggestions: ['Take a break every 25 minutes', 'Review confusion areas before next session'],
  };
}

export async function getRecommendations(learningState: any) {
  // In production: fetch(`${API_BASE}/recommendations`, { method: 'POST', body: ... })
  return learningState.recommendations;
}

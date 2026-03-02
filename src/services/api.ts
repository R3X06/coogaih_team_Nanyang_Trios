import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

// Editable backend endpoint base URL
const API_BASE = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID || 'localhost'}.supabase.co/functions/v1`;

// ---- User Management ----
export async function ensureUser(userId?: string): Promise<Tables<'users'>> {
  if (userId) {
    const { data } = await supabase.from('users').select('*').eq('id', userId).single();
    if (data) return data;
  }
  const { data, error } = await supabase.from('users').insert({ display_name: 'Hackathon User' }).select().single();
  if (error) throw error;
  return data!;
}

// ---- Sessions ----
export async function createSession(insert: TablesInsert<'sessions'>) {
  const { data, error } = await supabase.from('sessions').insert(insert).select().single();
  if (error) throw error;
  return data!;
}

export async function updateSession(id: string, updates: Partial<TablesInsert<'sessions'>>) {
  const { data, error } = await supabase.from('sessions').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data!;
}

export async function getSessions(userId: string) {
  const { data, error } = await supabase.from('sessions').select('*').eq('user_id', userId).order('start_time', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getSession(id: string) {
  const { data, error } = await supabase.from('sessions').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

// ---- Quizzes ----
export async function createQuiz(insert: TablesInsert<'quizzes'>) {
  const { data, error } = await supabase.from('quizzes').insert(insert).select().single();
  if (error) throw error;
  return data!;
}

export async function getQuizBySession(sessionId: string) {
  const { data } = await supabase.from('quizzes').select('*').eq('session_id', sessionId).order('created_at', { ascending: false }).limit(1).maybeSingle();
  return data;
}

// ---- Quiz Attempts ----
export async function createQuizAttempt(insert: TablesInsert<'quiz_attempts'>) {
  const { data, error } = await supabase.from('quiz_attempts').insert(insert).select().single();
  if (error) throw error;
  return data!;
}

export async function getQuizAttempts(quizId: string) {
  const { data } = await supabase.from('quiz_attempts').select('*').eq('quiz_id', quizId).order('created_at', { ascending: false });
  return data || [];
}

// ---- State Snapshots ----
export async function getLatestSnapshots(userId: string) {
  const { data } = await supabase.from('state_snapshots').select('*').eq('user_id', userId).order('timestamp', { ascending: false });
  return data || [];
}

export async function getLatestSnapshotPerTopic(userId: string) {
  const all = await getLatestSnapshots(userId);
  const map = new Map<string, Tables<'state_snapshots'>>();
  for (const s of all) {
    if (!map.has(s.topic_tag)) map.set(s.topic_tag, s);
  }
  return Array.from(map.values());
}

export async function upsertSnapshot(insert: TablesInsert<'state_snapshots'>) {
  const { data, error } = await supabase.from('state_snapshots').insert(insert).select().single();
  if (error) throw error;
  return data!;
}

// ---- Recommendations ----
export async function getLatestRecommendation(userId: string) {
  const { data } = await supabase.from('recommendations').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle();
  return data;
}

export async function createRecommendation(insert: TablesInsert<'recommendations'>) {
  const { data, error } = await supabase.from('recommendations').insert(insert).select().single();
  if (error) throw error;
  return data!;
}

// ---- AI Backend Calls (editable endpoints — mock for MVP) ----

export async function callGenerateQuiz(topics: string[], keyPoints: string[], confusion: string) {
  // In production: const res = await fetch(`${API_BASE}/generate-quiz`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ topics, keyPoints, confusion }) });
  // Mock response:
  const questions = [
    { id: '1', question: `What is the core principle behind ${topics[0] || 'this topic'}?`, type: 'mcq', options: ['Fundamental axioms', 'Derived theorems', 'Empirical observations', 'Historical precedent'], correct: 0 },
    { id: '2', question: 'Which learning strategy maximizes long-term retention?', type: 'mcq', options: ['Passive re-reading', 'Spaced retrieval practice', 'Highlighting key terms', 'Summarizing notes'], correct: 1 },
    { id: '3', question: `How would you address the confusion around: "${confusion || 'key concepts'}"?`, type: 'mcq', options: ['Skip and move on', 'Review prerequisites', 'Advanced deep-dive', 'Peer discussion'], correct: 1 },
    { id: '4', question: 'Interleaved practice is most effective because:', type: 'mcq', options: ['It reduces study time', 'It forces discrimination between concepts', 'It is easier', 'It avoids confusion'], correct: 1 },
    { id: '5', question: 'Metacognitive calibration refers to:', type: 'mcq', options: ['Speed of recall', 'Accuracy of self-assessment', 'Volume of material covered', 'Depth of understanding'], correct: 1 },
  ].slice(0, Math.min(5, Math.max(3, topics.length + 2)));
  return { questions, sources: [{ type: 'mock', note: 'Generated locally for hackathon MVP' }] };
}

export async function callGradeQuiz(questions: any[], answers: any[], confidences: any[]) {
  // Mock grading
  const results = questions.map((q: any, i: number) => ({
    questionId: q.id,
    correct: answers[i] === q.correct,
    userAnswer: answers[i],
    correctAnswer: q.correct,
    confidence: confidences[i] || 3,
  }));
  const score = results.filter((r: any) => r.correct).length / results.length;
  return { results, score };
}

export async function callUpdateState(userId: string, topics: string[], quizScore: number, telemetry: any) {
  // Mock state update — in production this calls your AI endpoint
  const snapshots = topics.map(topic => ({
    user_id: userId,
    topic_tag: topic,
    concept_strength: Math.min(1, Math.max(0, quizScore * 0.8 + Math.random() * 0.2)),
    stability: Math.min(1, Math.max(0, 0.5 + (quizScore - 0.5) * 0.4)),
    calibration_gap: Math.min(1, Math.max(0, Math.abs(quizScore - 0.7) + Math.random() * 0.15)),
    stamina: Math.min(1, Math.max(0, 1 - (telemetry?.distraction_ratio || 0.2))),
    recovery_rate: Math.min(1, Math.max(0, 0.6 + Math.random() * 0.3)),
    velocity_magnitude: Math.min(1, Math.max(0, Math.random() * 0.5 + 0.3)),
    velocity_direction: Math.min(1, Math.max(-1, quizScore > 0.6 ? 0.3 + Math.random() * 0.4 : -0.2 - Math.random() * 0.3)),
    risk_score: Math.min(1, Math.max(0, quizScore < 0.5 ? 0.7 + Math.random() * 0.2 : 0.2 + Math.random() * 0.2)),
    certainty: Math.min(1, Math.max(0, 0.5 + Math.random() * 0.4)),
  }));
  return snapshots;
}

export async function callGenerateAdvice(userId: string, snapshots: any[], sessionData: any) {
  // Mock recommendation — in production calls AI endpoint
  const avgRisk = snapshots.length > 0 ? snapshots.reduce((a: number, s: any) => a + (s.risk_score || 0), 0) / snapshots.length : 0.3;
  const weakestTopic = snapshots.sort((a: any, b: any) => (a.concept_strength || 0) - (b.concept_strength || 0))[0];

  return {
    user_id: userId,
    session_id: sessionData?.id || null,
    learner_profile: avgRisk > 0.5 ? 'At-risk learner showing gaps in foundational concepts' : 'Progressing learner with solid foundations',
    risk_analysis: avgRisk > 0.5
      ? `Elevated risk (${(avgRisk * 100).toFixed(0)}%). Key driver: low concept strength in ${weakestTopic?.topic_tag || 'core topics'}.`
      : `Moderate risk (${(avgRisk * 100).toFixed(0)}%). Trajectory is positive.`,
    primary_action_json: {
      action: weakestTopic ? `Deep review: ${weakestTopic.topic_tag}` : 'Continue current study plan',
      reason: weakestTopic ? `Concept strength at ${((weakestTopic.concept_strength || 0) * 100).toFixed(0)}%` : 'Steady progress',
      urgency: avgRisk > 0.5 ? 'high' : 'medium',
    },
    secondary_actions_json: [
      { action: 'Practice with interleaved problem sets', reason: 'Builds discrimination between similar concepts' },
      { action: 'Schedule spaced review in 48 hours', reason: 'Optimal retention window' },
    ],
    evidence_json: {
      quiz_score: sessionData?.quiz_score || null,
      attention_profile: sessionData?.telemetry || null,
      snapshot_count: snapshots.length,
    },
    certainty_statement: `Based on ${snapshots.length} data points. Confidence: ${avgRisk > 0.5 ? 'moderate' : 'high'}.`,
  };
}

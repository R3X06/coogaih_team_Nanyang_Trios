import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

// ============================================================
// Editable Backend API Base URL
// Set VITE_COOGAIH_API_BASE_URL in your .env or environment.
// Falls back to empty string (mock mode) if not set.
// ============================================================
const API_BASE = import.meta.env.VITE_COOGAIH_API_BASE_URL || '';

async function apiFetch<T>(path: string, body: any): Promise<T> {
  if (!API_BASE) {
    console.warn(`[coogaih] No API base URL set. Using mock for ${path}`);
    return getMockResponse(path, body);
  }
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API ${path} failed (${res.status}): ${err}`);
  }
  return res.json();
}

// ============================================================
// 1) POST /attention/analyze
// ============================================================
export interface AttentionAnalyzeInput {
  session_goal: string;
  attention_vector: {
    research_ratio: number;
    practice_ratio: number;
    notes_ratio: number;
    distraction_ratio: number;
    fragmentation: number;
    avg_focus_block_minutes: number;
    switching_rate: number;
    switches_count: number;
  };
}

export interface AttentionAnalyzeOutput {
  session_quality_score: number;
  attention_issues: string[];
  behavior_mismatch: string;
  recommended_adjustment: string;
}

export async function callAttentionAnalyze(input: AttentionAnalyzeInput): Promise<AttentionAnalyzeOutput> {
  const { data, error } = await supabase.functions.invoke('attention-analyze', { body: input });
  if (error) throw error;
  return data as AttentionAnalyzeOutput;
}

// ============================================================
// 2) POST /quiz/generate
// ============================================================
export interface QuizGenerateInput {
  topic_tags: string[];
  debrief_key_points: string[];
  notes_text_optional: string;
  retrieval_namespace: string;
}

export interface QuizGenerateOutput {
  questions: any[];
  source_references: any[];
}

export async function callQuizGenerate(input: QuizGenerateInput): Promise<QuizGenerateOutput> {
  const { data, error } = await supabase.functions.invoke('quiz-generate', { body: input });
  if (error) throw error;
  return data as QuizGenerateOutput;
}

// ============================================================
// 3) POST /quiz/grade
// ============================================================
export interface QuizGradeInput {
  questions: any[];
  user_answers: any[];
}

export interface QuizGradeOutput {
  results: any[];
  overall_score: number;
}

export async function callQuizGrade(input: QuizGradeInput): Promise<QuizGradeOutput> {
  const { data, error } = await supabase.functions.invoke('quiz-grade', { body: input });
  if (error) throw error;
  return data as QuizGradeOutput;
}

// ============================================================
// 4) POST /state/update
// ============================================================
export interface StateUpdateInput {
  user_id: string;
  session_id: string;
  topic_tags: string[];
  attention_vector: AttentionAnalyzeInput['attention_vector'];
  quiz_summary: {
    overall_score: number;
    results: any[];
    confidence_pre_submit_json: any;
    response_times_json: any;
  };
}

export interface StateUpdateOutput {
  updated_state_by_topic: Array<{
    topic_tag: string;
    skill_vector: {
      concept_strength: number;
      stability: number;
      calibration_gap: number;
      stamina: number;
      recovery_rate: number;
    };
    velocity: {
      velocity_magnitude: number;
      velocity_direction: number;
    };
    risk_score: number;
    certainty: number;
  }>;
}

export async function callStateUpdate(input: StateUpdateInput): Promise<StateUpdateOutput> {
  return apiFetch('/state/update', input);
}

// ============================================================
// 4b) POST /state/analyze (Cognitive Pattern Analyzer)
// ============================================================
export interface StateAnalyzeInput {
  skill_vector: Record<string, number>;
  velocity: Record<string, number>;
  risk_score: number;
  certainty: number;
  attention_vector: AttentionAnalyzeInput['attention_vector'];
  recent_trends: any;
}

export interface StateAnalyzeOutput {
  learner_profile: string;
  risk_analysis: string;
  key_weaknesses: string[];
  certainty_statement: string;
}

export async function callStateAnalyze(input: StateAnalyzeInput): Promise<StateAnalyzeOutput> {
  const { data, error } = await supabase.functions.invoke('state-analyze', { body: input });
  if (error) throw error;
  return data as StateAnalyzeOutput;
}

// ============================================================
// 5) POST /advice/generate
// ============================================================
export interface AdviceGenerateInput {
  user_id: string;
  session_id: string;
  latest_states: StateUpdateOutput['updated_state_by_topic'];
  historical_intervention_effects: {
    timed_drills: number;
    spaced_recall: number;
    concept_deep_dive: number;
    short_focus_blocks: number;
  };
}

export interface AdviceGenerateOutput {
  learner_profile: string;
  risk_analysis: string;
  primary_action: any;
  secondary_actions: any[];
  certainty_statement: string;
  evidence: any[];
}

export async function callAdviceGenerate(input: AdviceGenerateInput): Promise<AdviceGenerateOutput> {
  const { data, error } = await supabase.functions.invoke('advice-generate', { body: input });
  if (error) throw error;
  return data as AdviceGenerateOutput;
}

// ============================================================
// 6) POST /advice/validate (Evaluator)
// ============================================================
export interface AdviceValidateInput {
  diagnoser_output: any;
  planner_output: any;
  original_metrics: any;
}

export async function callAdviceValidate(input: AdviceValidateInput): Promise<any> {
  const { data, error } = await supabase.functions.invoke('advice-validate', { body: input });
  if (error) throw error;
  return data;
}
// ============================================================
// 7) POST /insight/snapshot (Cognitive Snapshot)
// ============================================================
export interface InsightSnapshotInput {
  profile: any;
  subject_aggregates: any;
  recent_states: any[];
  recent_sessions: any[];
}

export interface InsightSnapshotOutput {
  snapshot_summary: string;
  top_pattern_detected: string;
  emerging_risk: string | null;
  confidence: number;
}

export async function callInsightSnapshot(input: InsightSnapshotInput): Promise<InsightSnapshotOutput> {
  const { data, error } = await supabase.functions.invoke('insight-snapshot', { body: input });
  if (error) throw error;
  return data as InsightSnapshotOutput;
}

// ============================================================
// Supabase DB operations (unchanged)
// ============================================================

export async function ensureUser(userId?: string): Promise<Tables<'users'>> {
  if (userId) {
    const { data } = await supabase.from('users').select('*').eq('id', userId).single();
    if (data) return data;
  }
  const { data, error } = await supabase.from('users').insert({ display_name: 'Hackathon User' }).select().single();
  if (error) throw error;
  return data!;
}

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

export async function createQuiz(insert: TablesInsert<'quizzes'>) {
  const { data, error } = await supabase.from('quizzes').insert(insert).select().single();
  if (error) throw error;
  return data!;
}

export async function getQuizBySession(sessionId: string) {
  const { data } = await supabase.from('quizzes').select('*').eq('session_id', sessionId).order('created_at', { ascending: false }).limit(1).maybeSingle();
  return data;
}

export async function createQuizAttempt(insert: TablesInsert<'quiz_attempts'>) {
  const { data, error } = await supabase.from('quiz_attempts').insert(insert).select().single();
  if (error) throw error;
  return data!;
}

export async function getQuizAttempts(quizId: string) {
  const { data } = await supabase.from('quiz_attempts').select('*').eq('quiz_id', quizId).order('created_at', { ascending: false });
  return data || [];
}

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

export async function getLatestRecommendation(userId: string) {
  const { data } = await supabase.from('recommendations').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle();
  return data;
}

export async function createRecommendation(insert: TablesInsert<'recommendations'>) {
  const { data, error } = await supabase.from('recommendations').insert(insert).select().single();
  if (error) throw error;
  return data!;
}

// ============================================================
// Subject / Chapter / Topic CRUD
// ============================================================
export async function getSubjects() {
  const { data, error } = await supabase.from('subjects').select('*').order('name');
  if (error) throw error;
  return data || [];
}

export async function createSubject(insert: { name: string; description?: string; color_accent?: string; user_id?: string }) {
  const { data, error } = await supabase.from('subjects').insert(insert as any).select().single();
  if (error) throw error;
  return data!;
}

export async function deleteSubject(id: string) {
  const { error } = await supabase.from('subjects').delete().eq('id', id);
  if (error) throw error;
}

export async function getSubject(id: string) {
  const { data, error } = await supabase.from('subjects').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function getChaptersBySubject(subjectId: string) {
  const { data, error } = await supabase.from('chapters').select('*').eq('subject_id', subjectId).order('order_index');
  if (error) throw error;
  return data || [];
}

export async function createChapter(insert: { subject_id: string; name: string; order_index?: number; user_id?: string }) {
  const { data, error } = await supabase.from('chapters').insert(insert as any).select().single();
  if (error) throw error;
  return data!;
}

export async function deleteChapter(id: string) {
  const { error } = await supabase.from('chapters').delete().eq('id', id);
  if (error) throw error;
}

export async function getTopicsByChapter(chapterId: string) {
  const { data, error } = await supabase.from('topics').select('*').eq('chapter_id', chapterId).order('order_index');
  if (error) throw error;
  return data || [];
}

export async function createTopic(insert: { chapter_id: string; name: string; order_index?: number; user_id?: string }) {
  const { data, error } = await supabase.from('topics').insert(insert as any).select().single();
  if (error) throw error;
  return data!;
}

export async function deleteTopic(id: string) {
  const { error } = await supabase.from('topics').delete().eq('id', id);
  if (error) throw error;
}

export async function getTopicsBySubject(subjectId: string) {
  const chapters = await getChaptersBySubject(subjectId);
  const chapterIds = chapters.map(c => c.id);
  if (chapterIds.length === 0) return [];
  const { data, error } = await supabase.from('topics').select('*').in('chapter_id', chapterIds).order('order_index');
  if (error) throw error;
  return data || [];
}

export async function getSessionsBySubject(userId: string, subjectId: string) {
  const { data, error } = await supabase.from('sessions').select('*').eq('user_id', userId).eq('subject_id', subjectId).order('start_time', { ascending: false });
  if (error) throw error;
  return data || [];
}

// ============================================================
// Manual Logs
// ============================================================
export async function createManualLog(insert: any) {
  const { data, error } = await supabase.from('manual_logs').insert(insert).select().single();
  if (error) throw error;
  return data!;
}

export async function getManualLogs(userId: string) {
  const { data, error } = await supabase.from('manual_logs').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getManualLogsBySubject(userId: string, subjectId: string) {
  const { data, error } = await supabase.from('manual_logs').select('*').eq('user_id', userId).eq('subject_id', subjectId).order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

// ============================================================
// Mock responses (used when VITE_COOGAIH_API_BASE_URL is not set)
// ============================================================
function getMockResponse(path: string, body: any): any {
  switch (path) {
    case '/attention/analyze': {
      const av = body.attention_vector;
      const issues: string[] = [];
      if (av.distraction_ratio > 0.3) issues.push('High distraction ratio');
      if (av.fragmentation > 0.5) issues.push('Fragmented attention');
      if (av.switching_rate > 0.4) issues.push('Excessive task switching');
      return {
        session_quality_score: Math.max(0, 1 - av.distraction_ratio - av.fragmentation * 0.5),
        attention_issues: issues.length > 0 ? issues : ['No major issues detected'],
        behavior_mismatch: av.distraction_ratio > 0.3 && body.session_goal === 'practice'
          ? 'Goal was practice but high distraction observed' : 'None detected',
        recommended_adjustment: av.fragmentation > 0.5
          ? 'Try longer uninterrupted focus blocks (25+ min)' : 'Current pattern is effective',
      };
    }
    case '/quiz/generate': {
      const topics = body.topic_tags || [];
      const questions = [
        { id: '1', question: `What is the core principle behind ${topics[0] || 'this topic'}?`, type: 'mcq', options: ['Fundamental axioms', 'Derived theorems', 'Empirical observations', 'Historical precedent'], correct: 0 },
        { id: '2', question: 'Which strategy maximizes long-term retention?', type: 'mcq', options: ['Passive re-reading', 'Spaced retrieval practice', 'Highlighting', 'Summarizing'], correct: 1 },
        { id: '3', question: 'Interleaved practice helps because:', type: 'mcq', options: ['Reduces time', 'Forces discrimination', 'Is easier', 'Avoids confusion'], correct: 1 },
        { id: '4', question: 'Metacognitive calibration refers to:', type: 'mcq', options: ['Speed of recall', 'Accuracy of self-assessment', 'Volume covered', 'Depth of understanding'], correct: 1 },
        { id: '5', question: 'Active recall is best combined with:', type: 'mcq', options: ['Passive review', 'Interleaved practice', 'Highlighting', 'Re-reading'], correct: 1 },
      ].slice(0, Math.min(5, Math.max(3, topics.length + 2)));
      return { questions, source_references: [{ type: 'mock', note: 'Local mock for hackathon' }] };
    }
    case '/quiz/grade': {
      const results = body.questions.map((q: any, i: number) => ({
        questionId: q.id, correct: body.user_answers[i] === q.correct,
        userAnswer: body.user_answers[i], correctAnswer: q.correct,
      }));
      return { results, overall_score: results.filter((r: any) => r.correct).length / results.length };
    }
    case '/state/update': {
      const score = body.quiz_summary?.overall_score || 0.5;
      return {
        updated_state_by_topic: (body.topic_tags || []).map((tag: string) => ({
          topic_tag: tag,
          skill_vector: {
            concept_strength: Math.min(1, score * 0.8 + Math.random() * 0.2),
            stability: Math.min(1, 0.5 + (score - 0.5) * 0.4),
            calibration_gap: Math.min(1, Math.abs(score - 0.7) + Math.random() * 0.15),
            stamina: Math.min(1, 1 - (body.attention_vector?.distraction_ratio || 0.2)),
            recovery_rate: Math.min(1, 0.6 + Math.random() * 0.3),
          },
          velocity: {
            velocity_magnitude: Math.min(1, Math.random() * 0.5 + 0.3),
            velocity_direction: score > 0.6 ? 0.3 + Math.random() * 0.4 : -0.2 - Math.random() * 0.3,
          },
          risk_score: score < 0.5 ? 0.7 + Math.random() * 0.2 : 0.2 + Math.random() * 0.2,
          certainty: 0.5 + Math.random() * 0.4,
        })),
      };
    }
    case '/advice/generate': {
      const states = body.latest_states || [];
      const avgRisk = states.length > 0 ? states.reduce((a: number, s: any) => a + (s.risk_score || 0), 0) / states.length : 0.3;
      const weakest = [...states].sort((a: any, b: any) => (a.skill_vector?.concept_strength || 0) - (b.skill_vector?.concept_strength || 0))[0];
      return {
        learner_profile: avgRisk > 0.5 ? 'At-risk learner with foundational gaps' : 'Progressing learner with solid foundations',
        risk_analysis: `Risk level: ${(avgRisk * 100).toFixed(0)}%. ${weakest ? `Weakest area: ${weakest.topic_tag}` : ''}`,
        primary_action: {
          action: weakest ? `Deep review: ${weakest.topic_tag}` : 'Continue current plan',
          reason: weakest ? `Concept strength at ${((weakest.skill_vector?.concept_strength || 0) * 100).toFixed(0)}%` : 'Steady progress',
          urgency: avgRisk > 0.5 ? 'high' : 'medium',
        },
        secondary_actions: [
          { action: 'Interleaved problem sets', reason: 'Builds concept discrimination' },
          { action: 'Spaced review in 48h', reason: 'Optimal retention window' },
        ],
        certainty_statement: `Based on ${states.length} data points. Confidence: ${avgRisk > 0.5 ? 'moderate' : 'high'}.`,
        evidence: states.map((s: any) => ({ topic: s.topic_tag, risk: s.risk_score, strength: s.skill_vector?.concept_strength })),
      };
    }
    default:
      throw new Error(`Unknown mock path: ${path}`);
  }
}

import { useState, useEffect, useCallback } from 'react';
import type { StudySession, LearningState, SkillVector, Recommendation } from '@/types/session';
import { DEFAULT_USER_ID } from '@/types/session';

const SESSIONS_KEY = 'coogaih_sessions';
const LEARNING_STATE_KEY = 'coogaih_learning_state';

function getStoredSessions(): StudySession[] {
  try {
    const data = localStorage.getItem(SESSIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

function storeSessions(sessions: StudySession[]) {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

function getStoredLearningState(): LearningState {
  try {
    const data = localStorage.getItem(LEARNING_STATE_KEY);
    if (data) return JSON.parse(data);
  } catch {}
  return defaultLearningState();
}

function storeLearningState(state: LearningState) {
  localStorage.setItem(LEARNING_STATE_KEY, JSON.stringify(state));
}

function defaultLearningState(): LearningState {
  return {
    userId: DEFAULT_USER_ID,
    skills: [
      { topic: 'Mathematics', mastery: 45, recentTrend: 'improving' },
      { topic: 'Physics', mastery: 60, recentTrend: 'stable' },
      { topic: 'Computer Science', mastery: 72, recentTrend: 'improving' },
      { topic: 'Biology', mastery: 38, recentTrend: 'declining' },
      { topic: 'Chemistry', mastery: 55, recentTrend: 'stable' },
      { topic: 'Literature', mastery: 65, recentTrend: 'improving' },
    ],
    riskScore: 35,
    attentionAvg: 7.2,
    lastUpdated: new Date().toISOString(),
    recommendations: [
      { id: '1', action: 'Review Biology fundamentals', reason: 'Mastery declining over last 3 sessions', priority: 'high' },
      { id: '2', action: 'Practice Mathematics problem sets', reason: 'Trending up — capitalize on momentum', priority: 'medium' },
      { id: '3', action: 'Schedule shorter, focused CS sessions', reason: 'Attention drops after 25 min in CS topics', priority: 'low' },
    ],
  };
}

export function useStudySessions() {
  const [sessions, setSessions] = useState<StudySession[]>(getStoredSessions);

  useEffect(() => { storeSessions(sessions); }, [sessions]);

  const addSession = useCallback((session: StudySession) => {
    setSessions(prev => [session, ...prev]);
  }, []);

  const updateSession = useCallback((id: string, updates: Partial<StudySession>) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  }, []);

  const getSession = useCallback((id: string) => {
    return sessions.find(s => s.id === id);
  }, [sessions]);

  return { sessions, addSession, updateSession, getSession };
}

export function useLearningState() {
  const [state, setState] = useState<LearningState>(getStoredLearningState);

  useEffect(() => { storeLearningState(state); }, [state]);

  const updateAfterQuiz = useCallback((score: number, topics: string[]) => {
    setState(prev => {
      const newSkills = prev.skills.map(s => {
        if (topics.includes(s.topic)) {
          const delta = score >= 80 ? 5 : score >= 60 ? 2 : -3;
          const newMastery = Math.max(0, Math.min(100, s.mastery + delta));
          const trend = delta > 0 ? 'improving' as const : delta < 0 ? 'declining' as const : 'stable' as const;
          return { ...s, mastery: newMastery, recentTrend: trend };
        }
        return s;
      });
      const newRisk = Math.max(0, Math.min(100, prev.riskScore + (score < 60 ? 5 : -3)));
      return { ...prev, skills: newSkills, riskScore: newRisk, lastUpdated: new Date().toISOString() };
    });
  }, []);

  return { learningState: state, updateAfterQuiz };
}

export interface StudySession {
  id: string;
  userId: string;
  startTime: string;
  endTime?: string;
  duration?: number; // seconds
  status: 'active' | 'completed';
  telemetry: TelemetryEntry[];
  debrief?: SessionDebrief;
  quiz?: MicroCheckQuiz;
}

export interface TelemetryEntry {
  timestamp: string;
  focusLevel: number; // 1-10
  distractionFlag: boolean;
  note?: string;
}

export interface SessionDebrief {
  topics: string[];
  keyPoints: string[];
  confusionAreas: string[];
  notes?: string;
}

export interface MicroCheckQuiz {
  questions: QuizQuestion[];
  completedAt?: string;
  score?: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  userAnswer?: number;
  confidence?: number; // 1-5
}

export interface LearningState {
  userId: string;
  skills: SkillVector[];
  riskScore: number; // 0-100
  attentionAvg: number;
  lastUpdated: string;
  recommendations: Recommendation[];
}

export interface SkillVector {
  topic: string;
  mastery: number; // 0-100
  recentTrend: 'improving' | 'stable' | 'declining';
}

export interface Recommendation {
  id: string;
  action: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

export const DEFAULT_USER_ID = 'hackathon-user-1';

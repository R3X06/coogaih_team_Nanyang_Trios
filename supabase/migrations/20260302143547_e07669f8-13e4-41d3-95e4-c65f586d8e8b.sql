
-- Create goal_type enum
CREATE TYPE public.goal_type AS ENUM ('revision', 'practice', 'research', 'notes', 'mixed');

-- 1) users
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users are publicly readable" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can insert themselves" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update themselves" ON public.users FOR UPDATE USING (true);

-- 2) sessions
CREATE TABLE public.sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_time TIMESTAMP WITH TIME ZONE,
  duration_sec INTEGER,
  goal_type public.goal_type NOT NULL DEFAULT 'mixed',
  topic_tags TEXT[] DEFAULT '{}',
  debrief_key_points TEXT[] DEFAULT '{}',
  debrief_confusion TEXT,
  confidence_post INTEGER CHECK (confidence_post BETWEEN 1 AND 5),
  difficulty_post INTEGER CHECK (difficulty_post BETWEEN 1 AND 5),
  notes_file_url TEXT,
  research_ratio NUMERIC(4,3) CHECK (research_ratio BETWEEN 0 AND 1),
  practice_ratio NUMERIC(4,3) CHECK (practice_ratio BETWEEN 0 AND 1),
  notes_ratio NUMERIC(4,3) CHECK (notes_ratio BETWEEN 0 AND 1),
  distraction_ratio NUMERIC(4,3) CHECK (distraction_ratio BETWEEN 0 AND 1),
  fragmentation NUMERIC(4,3) CHECK (fragmentation BETWEEN 0 AND 1),
  avg_focus_block_minutes NUMERIC(6,2),
  switching_rate NUMERIC(4,3) CHECK (switching_rate BETWEEN 0 AND 1),
  switches_count INTEGER DEFAULT 0
);
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sessions are publicly readable" ON public.sessions FOR SELECT USING (true);
CREATE POLICY "Anyone can insert sessions" ON public.sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update sessions" ON public.sessions FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete sessions" ON public.sessions FOR DELETE USING (true);

-- 3) quizzes
CREATE TABLE public.quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  questions_json JSONB NOT NULL DEFAULT '[]',
  sources_json JSONB
);
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Quizzes are publicly readable" ON public.quizzes FOR SELECT USING (true);
CREATE POLICY "Anyone can insert quizzes" ON public.quizzes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update quizzes" ON public.quizzes FOR UPDATE USING (true);

-- 4) quiz_attempts
CREATE TABLE public.quiz_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  answers_json JSONB NOT NULL DEFAULT '[]',
  confidence_pre_submit_json JSONB DEFAULT '[]',
  response_times_json JSONB DEFAULT '[]',
  results_json JSONB DEFAULT '{}',
  overall_score NUMERIC(4,3) CHECK (overall_score BETWEEN 0 AND 1)
);
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Quiz attempts are publicly readable" ON public.quiz_attempts FOR SELECT USING (true);
CREATE POLICY "Anyone can insert quiz attempts" ON public.quiz_attempts FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update quiz attempts" ON public.quiz_attempts FOR UPDATE USING (true);

-- 5) state_snapshots
CREATE TABLE public.state_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  topic_tag TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  concept_strength NUMERIC(4,3) CHECK (concept_strength BETWEEN 0 AND 1),
  stability NUMERIC(4,3) CHECK (stability BETWEEN 0 AND 1),
  calibration_gap NUMERIC(4,3) CHECK (calibration_gap BETWEEN 0 AND 1),
  stamina NUMERIC(4,3) CHECK (stamina BETWEEN 0 AND 1),
  recovery_rate NUMERIC(4,3) CHECK (recovery_rate BETWEEN 0 AND 1),
  velocity_magnitude NUMERIC(4,3) CHECK (velocity_magnitude BETWEEN 0 AND 1),
  velocity_direction NUMERIC(4,3) CHECK (velocity_direction BETWEEN -1 AND 1),
  risk_score NUMERIC(4,3) CHECK (risk_score BETWEEN 0 AND 1),
  certainty NUMERIC(4,3) CHECK (certainty BETWEEN 0 AND 1)
);
ALTER TABLE public.state_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Snapshots are publicly readable" ON public.state_snapshots FOR SELECT USING (true);
CREATE POLICY "Anyone can insert snapshots" ON public.state_snapshots FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update snapshots" ON public.state_snapshots FOR UPDATE USING (true);

-- 6) recommendations
CREATE TABLE public.recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  learner_profile TEXT NOT NULL,
  risk_analysis TEXT NOT NULL,
  primary_action_json JSONB NOT NULL DEFAULT '{}',
  secondary_actions_json JSONB DEFAULT '[]',
  evidence_json JSONB DEFAULT '{}',
  certainty_statement TEXT NOT NULL
);
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Recommendations are publicly readable" ON public.recommendations FOR SELECT USING (true);
CREATE POLICY "Anyone can insert recommendations" ON public.recommendations FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update recommendations" ON public.recommendations FOR UPDATE USING (true);

-- Indexes
CREATE INDEX idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX idx_quizzes_session_id ON public.quizzes(session_id);
CREATE INDEX idx_quiz_attempts_quiz_id ON public.quiz_attempts(quiz_id);
CREATE INDEX idx_state_snapshots_user_topic ON public.state_snapshots(user_id, topic_tag);
CREATE INDEX idx_recommendations_user_id ON public.recommendations(user_id);

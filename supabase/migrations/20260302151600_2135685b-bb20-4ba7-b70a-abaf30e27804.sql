
-- Add user_id to subjects (existing table, currently missing user_id)
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS user_id uuid;

-- Add user_id to chapters
ALTER TABLE public.chapters ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.chapters ADD COLUMN IF NOT EXISTS created_at timestamp with time zone NOT NULL DEFAULT now();

-- Add user_id to topics
ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS created_at timestamp with time zone NOT NULL DEFAULT now();

-- Extend sessions with new fields
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sessions' AND column_name='session_source') THEN
    CREATE TYPE public.session_source AS ENUM ('timer', 'manual');
    ALTER TABLE public.sessions ADD COLUMN session_source public.session_source NOT NULL DEFAULT 'timer';
  END IF;
END $$;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS manual_notes text;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS issues_faced text[] DEFAULT '{}'::text[];
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS next_steps text;

-- Create activity_type enum if not exists
DO $$ BEGIN
  CREATE TYPE public.activity_type AS ENUM ('revision', 'practice', 'research', 'notes', 'mixed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create manual_logs table
CREATE TABLE IF NOT EXISTS public.manual_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  duration_sec integer NOT NULL DEFAULT 0,
  subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
  chapter_id uuid REFERENCES public.chapters(id) ON DELETE SET NULL,
  topic_id uuid REFERENCES public.topics(id) ON DELETE SET NULL,
  activity_type public.activity_type NOT NULL DEFAULT 'mixed',
  what_i_did text NOT NULL DEFAULT '',
  key_points text[] DEFAULT '{}'::text[],
  issues_faced text[] DEFAULT '{}'::text[],
  confidence_post integer,
  difficulty_post integer,
  attachment_url text,
  linked_session_id uuid REFERENCES public.sessions(id) ON DELETE SET NULL
);

ALTER TABLE public.manual_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Manual logs are publicly readable" ON public.manual_logs FOR SELECT USING (true);
CREATE POLICY "Anyone can insert manual logs" ON public.manual_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update manual logs" ON public.manual_logs FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete manual logs" ON public.manual_logs FOR DELETE USING (true);

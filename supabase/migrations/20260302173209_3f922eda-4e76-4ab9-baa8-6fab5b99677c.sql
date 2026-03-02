CREATE TABLE public.cognitive_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  confidence_level text NOT NULL DEFAULT 'low',
  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  input_metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  session_count integer NOT NULL DEFAULT 0
);

ALTER TABLE public.cognitive_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own cognitive snapshots"
ON public.cognitive_snapshots FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cognitive snapshots"
ON public.cognitive_snapshots FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_cognitive_snapshots_user_created ON public.cognitive_snapshots(user_id, created_at DESC);
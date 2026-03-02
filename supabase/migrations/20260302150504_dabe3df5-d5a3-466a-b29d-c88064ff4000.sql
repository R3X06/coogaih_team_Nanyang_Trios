
-- subjects table
CREATE TABLE public.subjects (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  color_accent text NOT NULL DEFAULT '#f97316',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Subjects are publicly readable" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "Anyone can insert subjects" ON public.subjects FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update subjects" ON public.subjects FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete subjects" ON public.subjects FOR DELETE USING (true);

-- chapters table
CREATE TABLE public.chapters (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  name text NOT NULL,
  order_index integer NOT NULL DEFAULT 0
);
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Chapters are publicly readable" ON public.chapters FOR SELECT USING (true);
CREATE POLICY "Anyone can insert chapters" ON public.chapters FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update chapters" ON public.chapters FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete chapters" ON public.chapters FOR DELETE USING (true);

-- topics table
CREATE TABLE public.topics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chapter_id uuid NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  name text NOT NULL,
  embedding_vector jsonb,
  order_index integer NOT NULL DEFAULT 0
);
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Topics are publicly readable" ON public.topics FOR SELECT USING (true);
CREATE POLICY "Anyone can insert topics" ON public.topics FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update topics" ON public.topics FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete topics" ON public.topics FOR DELETE USING (true);

-- Extend sessions with optional subject/chapter/topic links
ALTER TABLE public.sessions
  ADD COLUMN subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
  ADD COLUMN chapter_id uuid REFERENCES public.chapters(id) ON DELETE SET NULL,
  ADD COLUMN primary_topic_id uuid REFERENCES public.topics(id) ON DELETE SET NULL;

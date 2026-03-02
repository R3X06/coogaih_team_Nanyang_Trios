
CREATE TABLE public.app_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "App config is publicly readable" ON public.app_config FOR SELECT USING (true);
CREATE POLICY "Anyone can insert app config" ON public.app_config FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update app config" ON public.app_config FOR UPDATE USING (true);

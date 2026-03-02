
-- Create enums for profile fields
CREATE TYPE public.education_level AS ENUM ('secondary', 'poly', 'university', 'other');
CREATE TYPE public.primary_goal AS ENUM ('exam', 'coursework', 'skills', 'consistency', 'tracking');
CREATE TYPE public.guidance_style AS ENUM ('tutor', 'consultant', 'tracker');
CREATE TYPE public.peak_focus_time AS ENUM ('morning', 'afternoon', 'evening', 'late_night');
CREATE TYPE public.study_environment AS ENUM ('quiet', 'noisy', 'mixed');
CREATE TYPE public.strength_type AS ENUM ('concepts', 'practice', 'both', 'unsure');
CREATE TYPE public.confidence_style AS ENUM ('often_overconfident', 'often_underconfident', 'calibrated', 'unsure');
CREATE TYPE public.persistence_style AS ENUM ('push_through', 'avoid_when_stuck', 'take_break_then_return');
CREATE TYPE public.feedback_tone AS ENUM ('direct', 'neutral', 'encouraging');
CREATE TYPE public.telemetry_level AS ENUM ('none', 'basic_domain_only', 'enhanced_titles_optional');
CREATE TYPE public.auth_provider AS ENUM ('microsoft', 'email', 'google', 'apple');

-- Add email, auth_provider, last_active_at to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS auth_provider public.auth_provider DEFAULT 'email';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_active_at timestamptz DEFAULT now();

-- Create profiles table
CREATE TABLE public.profiles (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  preferred_name text,
  timezone text DEFAULT 'Asia/Singapore',
  study_language text DEFAULT 'English',
  education_level public.education_level,
  institution text,
  year_of_study text,
  primary_goal public.primary_goal,
  preferred_guidance_style public.guidance_style DEFAULT 'tutor',
  notification_opt_in boolean DEFAULT true,
  typical_available_minutes_weekday integer DEFAULT 60,
  typical_available_minutes_weekend integer DEFAULT 120,
  preferred_session_length_minutes integer DEFAULT 25,
  peak_focus_time public.peak_focus_time DEFAULT 'evening',
  study_environment public.study_environment DEFAULT 'quiet',
  distraction_risk_self_rating integer DEFAULT 3,
  self_reported_strength public.strength_type DEFAULT 'unsure',
  common_failure_mode text[] DEFAULT '{}',
  confidence_style public.confidence_style DEFAULT 'unsure',
  persistence_style public.persistence_style DEFAULT 'take_break_then_return',
  preferred_feedback_tone public.feedback_tone DEFAULT 'neutral',
  telemetry_level public.telemetry_level DEFAULT 'basic_domain_only',
  allow_notes_indexing boolean DEFAULT true,
  allow_ai_use_of_debrief boolean DEFAULT true,
  data_retention_days integer DEFAULT 365,
  delete_data_on_request boolean DEFAULT false,
  profile_completion numeric DEFAULT 0,
  onboarding_completed boolean DEFAULT false,
  avatar_id text DEFAULT 'owl_scholar',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are publicly readable" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Anyone can insert profiles" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update profiles" ON public.profiles FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete profiles" ON public.profiles FOR DELETE USING (true);

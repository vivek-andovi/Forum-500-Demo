ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS travel_cities text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS question_answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT true;
-- Fix components.id back to text (JSON uses string IDs like "core_game_comp_gold")
ALTER TABLE public.components ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.components ALTER COLUMN id TYPE text USING id::text;
ALTER TABLE public.components ALTER COLUMN id SET DEFAULT '';

-- Create rules table
CREATE TABLE IF NOT EXISTS public.rules (
  id text PRIMARY KEY,
  category text,
  title_en text,
  title_ru text,
  text_en text,
  text_ru text,
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- updated_at trigger for rules
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'rules_set_updated_at'
  ) THEN
    CREATE TRIGGER rules_set_updated_at
    BEFORE UPDATE ON public.rules
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
  END IF;
END $$;

-- RLS for rules
ALTER TABLE public.rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read rules"
ON public.rules
FOR SELECT
USING (true);

CREATE POLICY "Public write rules"
ON public.rules
FOR ALL
USING (true)
WITH CHECK (true);
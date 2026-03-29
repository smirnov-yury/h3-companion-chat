CREATE TABLE public.component_types (
  key TEXT PRIMARY KEY,
  label_ru TEXT NOT NULL,
  label_en TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

INSERT INTO public.component_types (key, label_ru, label_en, sort_order) VALUES
  ('unit', 'Юниты', 'Units', 0),
  ('card', 'Карты', 'Cards', 1),
  ('hero', 'Герои', 'Heroes', 2),
  ('token', 'Жетоны', 'Tokens', 3),
  ('icon', 'Иконки', 'Icons', 4),
  ('schema', 'Схемы', 'Schemas', 5),
  ('game', 'Игровое', 'Game', 6),
  ('book', 'Книги', 'Books', 7),
  ('mission', 'Миссии', 'Missions', 8),
  ('location', 'Локации', 'Locations', 9),
  ('rule', 'Правила', 'Rules', 10),
  ('other', 'Прочее', 'Other', 11);

ALTER TABLE public.component_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read component_types" ON public.component_types FOR SELECT TO public USING (true);
CREATE POLICY "Public write component_types" ON public.component_types FOR ALL TO public USING (true) WITH CHECK (true);
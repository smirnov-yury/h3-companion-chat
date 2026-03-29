create extension if not exists pgcrypto;

-- components table: align schema for persisted admin CRUD
create table if not exists public.components (
  id uuid primary key default gen_random_uuid(),
  title_en text,
  title_ru text,
  body_en text,
  body_ru text,
  category text,
  type text,
  image text,
  cover_image_url text,
  faction text,
  rule_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.components
  add column if not exists title_en text,
  add column if not exists title_ru text,
  add column if not exists body_en text,
  add column if not exists body_ru text,
  add column if not exists category text,
  add column if not exists type text,
  add column if not exists image text,
  add column if not exists cover_image_url text,
  add column if not exists faction text,
  add column if not exists rule_id text,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

-- if legacy id is text, convert to uuid safely
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'components'
      AND column_name = 'id'
      AND data_type = 'text'
  ) THEN
    ALTER TABLE public.components ALTER COLUMN id DROP DEFAULT;
    ALTER TABLE public.components
      ALTER COLUMN id TYPE uuid
      USING (
        CASE
          WHEN id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' THEN id::uuid
          ELSE gen_random_uuid()
        END
      );
  END IF;
END $$;

alter table public.components
  alter column id set default gen_random_uuid();

-- categories table for labels + cover images
create table if not exists public.categories (
  key text primary key,
  label_ru text not null,
  label_en text not null,
  cover_image_url text,
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.categories
  add column if not exists label_ru text,
  add column if not exists label_en text,
  add column if not exists cover_image_url text,
  add column if not exists sort_order integer default 0,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

-- keep compatibility for old image_url data if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'categories'
      AND column_name = 'image_url'
  ) THEN
    UPDATE public.categories
    SET cover_image_url = COALESCE(cover_image_url, image_url)
    WHERE image_url IS NOT NULL;
  END IF;
END $$;

-- enforce non-null labels after backfill (where possible)
update public.categories set label_ru = key where label_ru is null;
update public.categories set label_en = key where label_en is null;

alter table public.categories
  alter column label_ru set not null,
  alter column label_en set not null;

-- updated_at triggers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'components_set_updated_at'
  ) THEN
    CREATE TRIGGER components_set_updated_at
    BEFORE UPDATE ON public.components
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'categories_set_updated_at'
  ) THEN
    CREATE TRIGGER categories_set_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
  END IF;
END $$;

-- RLS
alter table public.components enable row level security;
alter table public.categories enable row level security;

drop policy if exists "Public read components" on public.components;
drop policy if exists "Auth write components" on public.components;
drop policy if exists "Public write components" on public.components;

create policy "Public read components"
on public.components
for select
using (true);

create policy "Public write components"
on public.components
for all
using (true)
with check (true);

drop policy if exists "Public read categories" on public.categories;
drop policy if exists "Auth write categories" on public.categories;
drop policy if exists "Public write categories" on public.categories;

create policy "Public read categories"
on public.categories
for select
using (true);

create policy "Public write categories"
on public.categories
for all
using (true)
with check (true);

-- Storage bucket + policies for category covers
insert into storage.buckets (id, name, public)
values ('category-covers', 'category-covers', true)
on conflict (id) do update set public = true;

drop policy if exists "Public read category covers" on storage.objects;
drop policy if exists "Public insert category covers" on storage.objects;
drop policy if exists "Public update category covers" on storage.objects;
drop policy if exists "Public delete category covers" on storage.objects;

create policy "Public read category covers"
on storage.objects
for select
using (bucket_id = 'category-covers');

create policy "Public insert category covers"
on storage.objects
for insert
with check (bucket_id = 'category-covers');

create policy "Public update category covers"
on storage.objects
for update
using (bucket_id = 'category-covers')
with check (bucket_id = 'category-covers');

create policy "Public delete category covers"
on storage.objects
for delete
using (bucket_id = 'category-covers');
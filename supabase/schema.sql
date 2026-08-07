-- Techmaster — Supabase schema for articles
-- Run this once in the Supabase SQL editor (Dashboard → SQL Editor → New query).
--
-- Model: one `articles` row per article (shared/non-translatable fields) +
-- one `article_translations` row per locale (ar/en/fr/es) holding the
-- actual copy. This matches "كل مقال له ترجمة بـ4 لغات".
--
-- You manage content directly from the Supabase Table Editor:
--   1. Add a row to `articles` (category, cover image, published_at, status).
--   2. Add up to 4 rows to `article_translations` — one per locale — linked
--      via article_id. Only rows with locale in ('ar','en','fr','es') are
--      allowed; you don't have to fill all 4 at once, missing locales just
--      won't show on that language's site until you add them.
--   3. Set articles.status = 'published' when it's ready to go live.
--
-- The site reads through the `published_articles` view below — it only
-- exposes articles with status = 'published', so drafts never leak to the
-- public site even though RLS technically allows reading the view.

create extension if not exists "pgcrypto";

-- ── articles: fields shared across all locales ─────────────────────────────
create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  category text not null,               -- free text, shown as the category chip
                                         -- (matches the pillars in tasks.md, e.g.
                                         -- 'phones' | 'ai' | 'apps' | 'crypto' |
                                         -- 'security' | 'reviews' | 'general')
  cover_image_url text,
  featured boolean not null default false,  -- shows as the large "Featured" card
  status text not null default 'draft'
    check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.articles.status is
  'Set to ''published'' to make the article (and its translations) visible on the site.';

-- ── article_translations: the actual per-locale content ────────────────────
create table if not exists public.article_translations (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  locale text not null check (locale in ('ar', 'en', 'fr', 'es')),
  slug text not null,                   -- URL slug, unique per locale, e.g. 'best-mid-range-phones-2026'
  title text not null,
  excerpt text not null,                -- short summary shown on cards
  content text not null,                -- full article body (plain text / markdown paragraphs)
  read_time text,                       -- display string, e.g. '6 min read' / '٦ دقائق'
  meta_title text,                      -- optional SEO override, falls back to `title`
  meta_description text,                -- optional SEO override, falls back to `excerpt`
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (article_id, locale),
  unique (locale, slug)
);

create index if not exists article_translations_locale_idx
  on public.article_translations (locale);
create index if not exists articles_status_published_idx
  on public.articles (status, published_at desc);

-- ── keep updated_at fresh ───────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists articles_set_updated_at on public.articles;
create trigger articles_set_updated_at
  before update on public.articles
  for each row execute function public.set_updated_at();

drop trigger if exists article_translations_set_updated_at on public.article_translations;
create trigger article_translations_set_updated_at
  before update on public.article_translations
  for each row execute function public.set_updated_at();

-- ── public read view: flattens article + translation, published only ───────
-- The site queries this view exclusively — never the base tables directly —
-- so it never has to filter status/locale itself.
create or replace view public.published_articles as
select
  a.id,
  a.category,
  a.cover_image_url,
  a.featured,
  a.published_at,
  t.locale,
  t.slug,
  t.title,
  t.excerpt,
  t.content,
  t.read_time,
  t.meta_title,
  t.meta_description
from public.articles a
join public.article_translations t on t.article_id = a.id
where a.status = 'published';

-- ── row-level security ──────────────────────────────────────────────────────
-- Base tables stay locked down (only readable via the service role, e.g. from
-- a future admin panel or the SQL editor). The public site only ever needs
-- the published_articles view.
alter table public.articles enable row level security;
alter table public.article_translations enable row level security;

grant select on public.published_articles to anon, authenticated;

-- (Optional, only needed if you later add an authenticated admin panel that
-- reads drafts directly from the base tables — not required for the current
-- Table-Editor-only workflow.)
-- create policy "authenticated read all articles" on public.articles
--   for select to authenticated using (true);
-- create policy "authenticated read all translations" on public.article_translations
--   for select to authenticated using (true);

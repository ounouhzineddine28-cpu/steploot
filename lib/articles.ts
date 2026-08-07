import type {Locale} from '@/i18n/routing';
import {getSupabaseClient} from './supabase';

export type ArticleSummary = {
  slug: string;
  category: string;
  /** Short badge shown in the crypto list (BTC, ETH…); falls back to category. */
  tag?: string | null;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  featured: boolean;
};

export type ArticleDetail = ArticleSummary & {
  content: string;
  coverImageUrl: string | null;
};

const DATE_FORMATTERS: Record<Locale, Intl.DateTimeFormat> = {
  ar: new Intl.DateTimeFormat('ar', {dateStyle: 'long'}),
  en: new Intl.DateTimeFormat('en', {dateStyle: 'long'}),
  fr: new Intl.DateTimeFormat('fr', {dateStyle: 'long'}),
  es: new Intl.DateTimeFormat('es', {dateStyle: 'long'})
};

/*
  Arabic (or any non-ASCII) slugs travel through the URL percent-encoded, and
  the router may hand them over still encoded. Look the article up under both
  spellings so `/article/افضل-هواتف` resolves whichever form arrives.
*/
function slugVariants(slug: string): string[] {
  const variants = new Set<string>([slug]);

  try {
    variants.add(decodeURIComponent(slug));
  } catch {
    // malformed escape sequence — the raw value is all we have
  }
  try {
    variants.add(encodeURIComponent(slug));
  } catch {
    // ignore
  }

  return [...variants];
}

function formatDate(locale: Locale, publishedAt: string | null): string {
  if (!publishedAt) return '';
  return DATE_FORMATTERS[locale].format(new Date(publishedAt));
}

// Row shape of the `published_articles` view — see supabase/schema.sql.
type PublishedArticleRow = {
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  content: string;
  read_time: string | null;
  featured: boolean;
  published_at: string | null;
  cover_image_url: string | null;
  tag: string | null;
};

/**
 * Articles for the homepage "Trending News" section, newest first.
 * Supabase is the only source: no content means an empty section, which the
 * UI renders as an empty state. There is deliberately no placeholder data —
 * fake cards linking nowhere read as a broken site.
 */
export async function getTrendingArticles(
  locale: Locale,
  limit = 6
): Promise<ArticleSummary[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const {data, error} = await supabase
    .from('published_articles')
    .select('slug, category, title, excerpt, read_time, featured, published_at')
    .eq('locale', locale)
    .order('published_at', {ascending: false})
    .limit(limit);

  if (error) {
    console.error('[articles] trending query failed:', error.message);
    return [];
  }

  // Connected but empty means empty — never show demo content next to real
  // content; fake cards that link nowhere read as a broken site.
  return ((data ?? []) as PublishedArticleRow[]).map((row) => ({
    slug: row.slug,
    category: row.category,
    title: row.title,
    excerpt: row.excerpt,
    date: formatDate(locale, row.published_at),
    readTime: row.read_time ?? '',
    featured: row.featured
  }));
}

/**
 * A single article by slug, for the /article/[slug] page.
 * Returns null when nothing matches — callers show a 404.
 */
export async function getArticleBySlug(
  locale: Locale,
  slug: string
): Promise<ArticleDetail | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const {data, error} = await supabase
    .from('published_articles')
    .select(
      'slug, category, title, excerpt, content, read_time, featured, published_at, cover_image_url'
    )
    .eq('locale', locale)
    .in('slug', slugVariants(slug))
    .limit(1)
    .maybeSingle();

  // Connected: a missing slug is a genuine 404, not a reason to serve a demo.
  if (error || !data) return null;

  const row = data as PublishedArticleRow;
  return {
    slug: row.slug,
    category: row.category,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    date: formatDate(locale, row.published_at),
    readTime: row.read_time ?? '',
    featured: row.featured,
    coverImageUrl: row.cover_image_url
  };
}

/**
 * Every published article for a locale — used to build sitemap.xml and to
 * pre-render article pages.
 */
export async function getAllArticles(locale: Locale): Promise<
  Array<{slug: string; publishedAt: string | null}>
> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const {data, error} = await supabase
    .from('published_articles')
    .select('slug, published_at')
    .eq('locale', locale)
    .order('published_at', {ascending: false});

  if (error) {
    console.error('[articles] sitemap query failed:', error.message);
    return [];
  }

  return ((data ?? []) as Array<{slug: string; published_at: string | null}>).map((row) => ({
    slug: row.slug,
    publishedAt: row.published_at
  }));
}

/**
 * Articles in one category, newest first — powers the crypto list in the
 * "Extras & Crypto News" section. Empty until an article carries that
 * category.
 */
export async function getArticlesByCategory(
  locale: Locale,
  category: string,
  limit = 4
): Promise<ArticleSummary[]> {
  const supabase = getSupabaseClient();

  if (!supabase) return [];

  const {data, error} = await supabase
    .from('published_articles')
    .select('slug, category, title, excerpt, read_time, featured, published_at, tag')
    .eq('locale', locale)
    .ilike('category', category)
    .order('published_at', {ascending: false})
    .limit(limit);

  if (error) {
    console.error('[articles] category query failed:', error.message);
    return [];
  }

  return ((data ?? []) as PublishedArticleRow[]).map((row) => ({
    slug: row.slug,
    category: row.category,
    tag: row.tag,
    title: row.title,
    excerpt: row.excerpt,
    date: formatDate(locale, row.published_at),
    readTime: row.read_time ?? '',
    featured: row.featured
  }));
}

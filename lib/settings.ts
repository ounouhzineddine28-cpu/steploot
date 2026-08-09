import {cache} from 'react';
import {getSupabaseClient} from './supabase';
import {PLATFORM_LINKS, TELEGRAM_URL} from './site';

/*
  Runtime settings that live in Supabase so they can change without a deploy:
    app_config  — key/value pairs (telegram_url, crypto_category, …)
    platforms   — the "follow us on" buttons

  Both fall back to the constants in lib/site.ts when Supabase isn't
  connected or a value is missing, so the site never renders a dead button.
*/

export const getAppConfig = cache(async (): Promise<Record<string, string>> => {
  const supabase = getSupabaseClient();
  if (!supabase) return {};

  const {data, error} = await supabase.from('app_config').select('key, value');
  if (error || !data) return {};

  const config: Record<string, string> = {};
  for (const row of data as Array<{key: string; value: string | null}>) {
    if (row.value && row.value.trim()) config[row.key] = row.value.trim();
  }
  return config;
});

/** Telegram URL — from app_config, falling back to the repo constant. */
export async function getTelegramUrl(): Promise<string> {
  const config = await getAppConfig();
  return config.telegram_url || TELEGRAM_URL;
}

/** Which article category feeds the crypto news list. */
export async function getCryptoCategory(): Promise<string> {
  const config = await getAppConfig();
  return config.crypto_category || 'crypto';
}

export type CardStyle = 'featured' | 'grid' | 'news' | 'list';

export type CardLayout = {
  style: CardStyle;
  /** Cover image height in px — the author sets this exactly, not by ratio. */
  imageHeight: number;
  columns: 2 | 3 | 4;
};

/**
 * Homepage card layout, all of it editable from the admin panel.
 * Values are clamped so a typo in the settings table can't produce a broken
 * page (a 5000px image height, or zero columns).
 */
export async function getCardLayout(): Promise<CardLayout> {
  const config = await getAppConfig();

  const style = config.card_style as CardStyle;
  const height = Number.parseInt(config.card_image_height ?? '', 10);
  const columns = Number.parseInt(config.card_columns ?? '', 10);

  return {
    style: style === 'grid' || style === 'list' || style === 'news' ? style : 'featured',
    imageHeight: Number.isFinite(height) ? Math.min(Math.max(height, 120), 600) : 220,
    columns: columns === 2 || columns === 4 ? columns : 3
  };
}

export type Platform = {key: string; label: string; url: string};

/**
 * Enabled platform buttons, ordered. Rows with an empty URL are skipped —
 * that's how an unused platform stays out of the UI without being deleted.
 */
export const getPlatforms = cache(async (): Promise<Platform[]> => {
  const supabase = getSupabaseClient();

  if (supabase) {
    const {data, error} = await supabase
      .from('platforms')
      .select('key, label, url, enabled')
      .eq('enabled', true)
      .order('sort_order', {ascending: true});

    if (!error && data) {
      const rows = (data as Array<Platform & {enabled: boolean}>).filter(
        (row) => row.url && row.url.trim()
      );
      if (rows.length > 0) {
        return rows.map(({key, label, url}) => ({key, label, url: url.trim()}));
      }
    }
  }

  // Fallback: repo constants, minus any placeholder links.
  return PLATFORM_LINKS.filter((p) => p.href && p.href !== '#').map((p) => ({
    key: p.key,
    label: p.label,
    url: p.href
  }));
});

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

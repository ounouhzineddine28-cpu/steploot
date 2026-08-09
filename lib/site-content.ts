import {cache} from 'react';
import type {Locale} from '@/i18n/routing';
import {getSupabaseClient} from './supabase';

/*
  Every user-facing string on the site can be overridden from Supabase.

  messages/<locale>.json stays in the repo as the DEFAULT copy (and the
  offline fallback). The `site_content` table holds overrides keyed by the
  same dotted message key — e.g. key `hero.titleA`, locale `ar`. Anything
  present there wins; anything missing falls back to the JSON file.

  This is why editing a page's text never needs a redeploy.
*/

export type ContentOverrides = Record<string, string>;

// Deduped per request so one page render hits Supabase at most once per locale.
export const getContentOverrides = cache(
  async (locale: Locale): Promise<ContentOverrides> => {
    const supabase = getSupabaseClient();
    if (!supabase) return {};

    const {data, error} = await supabase
      .from('site_content')
      .select('key, value')
      .eq('locale', locale);

    if (error || !data) return {};

    const overrides: ContentOverrides = {};
    for (const row of data as Array<{key: string; value: string | null}>) {
      // An empty value means "use the default", not "render nothing".
      if (row.value && row.value.trim()) overrides[row.key] = row.value;
    }
    return overrides;
  }
);

type Messages = Record<string, unknown>;

/** Applies dotted-key overrides onto a messages object without mutating it. */
export function applyOverrides(messages: Messages, overrides: ContentOverrides): Messages {
  if (Object.keys(overrides).length === 0) return messages;

  const merged: Messages = structuredClone(messages);

  for (const [key, value] of Object.entries(overrides)) {
    const path = key.split('.');
    let node = merged;

    for (let i = 0; i < path.length - 1; i++) {
      const step = path[i];
      if (typeof node[step] !== 'object' || node[step] === null) node[step] = {};
      node = node[step] as Messages;
    }
    node[path[path.length - 1]] = value;
  }

  return merged;
}

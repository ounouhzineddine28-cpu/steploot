'use client';

import {createClient, type SupabaseClient} from '@supabase/supabase-js';

/*
  Browser Supabase client for the admin panel.
  Separate from lib/supabase.ts because this one persists the login session;
  the public site's client is read-only and anonymous.
*/
let browserClient: SupabaseClient | null | undefined;

export function getAdminClient(): SupabaseClient | null {
  if (browserClient !== undefined) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  browserClient =
    url && key
      ? createClient(url, key, {
          auth: {persistSession: true, autoRefreshToken: true}
        })
      : null;

  return browserClient;
}

const BUCKET = 'media';
const FOLDER = 'articles';

function slugifyFileName(name: string): string {
  const ext = name.includes('.') ? name.split('.').pop()!.toLowerCase() : 'png';
  const base = name
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);

  const stamp = Date.now().toString(36);
  return `${base || 'image'}-${stamp}.${ext}`;
}

/**
 * Uploads a file to the `media` bucket and returns its public URL.
 * Used by both the file picker and the paste/drop handlers.
 */
export async function uploadImage(file: File): Promise<string> {
  const supabase = getAdminClient();
  if (!supabase) throw new Error('Supabase غير مربوط');

  const path = `${FOLDER}/${slugifyFileName(file.name || 'pasted.png')}`;

  const {error} = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '31536000',
    upsert: false,
    contentType: file.type || 'image/png'
  });
  if (error) throw error;

  const {data} = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/** Inserts text at the caret of a textarea and returns the new value. */
export function insertAtCaret(
  el: HTMLTextAreaElement,
  snippet: string
): {value: string; caret: number} {
  const start = el.selectionStart ?? el.value.length;
  const end = el.selectionEnd ?? start;
  const before = el.value.slice(0, start);
  const after = el.value.slice(end);

  // Images live on their own block, so make sure they get blank lines around them.
  const lead = before && !before.endsWith('\n\n') ? (before.endsWith('\n') ? '\n' : '\n\n') : '';
  const tail = after && !after.startsWith('\n\n') ? (after.startsWith('\n') ? '\n' : '\n\n') : '';

  const value = before + lead + snippet + tail + after;
  return {value, caret: (before + lead + snippet).length};
}

/** Recent uploads, newest first — powers the image library in the editor. */
export async function listImages(limit = 60): Promise<Array<{name: string; url: string}>> {
  const supabase = getAdminClient();
  if (!supabase) return [];

  const {data, error} = await supabase.storage
    .from(BUCKET)
    .list(FOLDER, {limit, sortBy: {column: 'created_at', order: 'desc'}});

  if (error || !data) return [];

  return data
    .filter((file) => file.id)
    .map((file) => ({
      name: file.name,
      url: supabase.storage.from(BUCKET).getPublicUrl(`${FOLDER}/${file.name}`).data.publicUrl
    }));
}

/** Wraps the selection (or a placeholder) — used for bold, links, codes. */
export function wrapSelection(
  el: HTMLTextAreaElement,
  left: string,
  right: string,
  placeholder: string
): {value: string; selStart: number; selEnd: number} {
  const start = el.selectionStart ?? 0;
  const end = el.selectionEnd ?? start;
  const selected = el.value.slice(start, end) || placeholder;
  const value = el.value.slice(0, start) + left + selected + right + el.value.slice(end);

  return {
    value,
    selStart: start + left.length,
    selEnd: start + left.length + selected.length
  };
}

/** Puts a block prefix (##, >, -) on the selected lines, replacing any existing one. */
export function prefixLines(
  el: HTMLTextAreaElement,
  prefix: string,
  placeholder: string
): {value: string; selStart: number; selEnd: number} {
  const start = el.selectionStart ?? 0;
  const end = el.selectionEnd ?? start;
  const lineStart = el.value.lastIndexOf('\n', Math.max(start - 1, 0)) + 1;
  const nextBreak = el.value.indexOf('\n', end);
  const lineEnd = nextBreak === -1 ? el.value.length : nextBreak;

  const chunk = el.value.slice(lineStart, lineEnd) || placeholder;
  const cleaned = chunk
    .split('\n')
    .map((line) => prefix + line.replace(/^(#{2,3}\s+|>\s+|[-*]\s+)/, ''))
    .join('\n');

  return {
    value: el.value.slice(0, lineStart) + cleaned + el.value.slice(lineEnd),
    selStart: lineStart + prefix.length,
    selEnd: lineStart + cleaned.length
  };
}

/**
 * Builds a URL slug from a title. Keeps Arabic letters (valid in URLs and
 * indexed fine by Google) and Latin/digits; everything else becomes a dash.
 * Used when the author leaves the slug empty so a translation is never
 * silently dropped on save.
 */
export function slugifyTitle(title: string): string {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

  return slug || `article-${Date.now().toString(36)}`;
}

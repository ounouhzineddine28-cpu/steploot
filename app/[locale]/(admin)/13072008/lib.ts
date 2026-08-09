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
/*
  All three helpers below are pure: they take the current text and a caret
  position instead of reading the <textarea> at call time.

  That matters for images. Clicking the upload button moves focus out of the
  textarea, and the upload itself is async — by the time the file comes back,
  the browser's own selection is unreliable and React may not have flushed the
  previous edit yet. Reading the DOM there is what made every image land at the
  end of the article. The editor remembers the caret instead and passes it in.
*/

/** Inserts a block (image, divider…) at `start`, keeping blank lines around it. */
export function insertBlock(
  value: string,
  start: number,
  end: number,
  snippet: string
): {value: string; caret: number} {
  const before = value.slice(0, start);
  const after = value.slice(end);

  const lead = before && !before.endsWith('\n\n') ? (before.endsWith('\n') ? '\n' : '\n\n') : '';
  const tail = after && !after.startsWith('\n\n') ? (after.startsWith('\n') ? '\n' : '\n\n') : '';

  return {
    value: before + lead + snippet + tail + after,
    caret: (before + lead + snippet).length
  };
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
  value: string,
  start: number,
  end: number,
  left: string,
  right: string,
  placeholder: string
): {value: string; selStart: number; selEnd: number} {
  const selected = value.slice(start, end) || placeholder;
  const next = value.slice(0, start) + left + selected + right + value.slice(end);

  return {
    value: next,
    selStart: start + left.length,
    selEnd: start + left.length + selected.length
  };
}

/** Puts a block prefix (##, >, -) on the selected lines, replacing any existing one. */
export function prefixLines(
  value: string,
  start: number,
  end: number,
  prefix: string,
  placeholder: string
): {value: string; selStart: number; selEnd: number} {
  const lineStart = value.lastIndexOf('\n', Math.max(start - 1, 0)) + 1;
  const nextBreak = value.indexOf('\n', end);
  const lineEnd = nextBreak === -1 ? value.length : nextBreak;

  const chunk = value.slice(lineStart, lineEnd) || placeholder;
  const cleaned = chunk
    .split('\n')
    .map((line) => prefix + line.replace(/^(#{2,3}\s+|>\s+|[-*]\s+)/, ''))
    .join('\n');

  return {
    value: value.slice(0, lineStart) + cleaned + value.slice(lineEnd),
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

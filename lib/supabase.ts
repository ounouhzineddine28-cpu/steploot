import {createClient, type SupabaseClient} from '@supabase/supabase-js';

let client: SupabaseClient | null | undefined;

/**
 * Returns a Supabase client, or `null` if NEXT_PUBLIC_SUPABASE_URL /
 * NEXT_PUBLIC_SUPABASE_ANON_KEY aren't set yet.
 *
 * Callers (see lib/articles.ts) must handle the `null` case by falling back
 * to local demo data — this is what lets the site build and run *before*
 * you've connected a real Supabase project, and start reading real content
 * the moment you add the two env vars (see .env.local.example).
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (client !== undefined) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  client = url && anonKey ? createClient(url, anonKey) : null;
  return client;
}

import type {Locale} from '@/i18n/routing';
import {getSupabaseClient} from './supabase';

export type Product = {
  id: string;
  name: string;
  blurb: string;
  price: string | null;
  imageUrl: string | null;
  affiliateUrl: string | null;
};

/*
  Affiliate products for /[locale]/products, ordered by sort_order.
  Supabase is the only source — an empty result renders an empty state,
  never placeholder products (see AGENTS.md).
*/
export async function getProducts(locale: Locale): Promise<Product[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const {data, error} = await supabase
    .from('published_products')
    .select('id, name, blurb, price, image_url, affiliate_url')
    .eq('locale', locale)
    .order('sort_order', {ascending: true});

  if (error) {
    console.error('[products] query failed:', error.message);
    return [];
  }

  return ((data ?? []) as Array<{
    id: string;
    name: string;
    blurb: string;
    price: string | null;
    image_url: string | null;
    affiliate_url: string | null;
  }>).map((row) => ({
    id: row.id,
    name: row.name,
    blurb: row.blurb,
    price: row.price,
    imageUrl: row.image_url,
    affiliateUrl: row.affiliate_url
  }));
}

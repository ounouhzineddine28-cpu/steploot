// Site-wide constants — edit the real URLs here once, they're used everywhere.

export const SITE_NAME = 'steploot';

/**
 * Public URL of the live site — used for canonical links, hreflang,
 * Open Graph images, sitemap.xml and robots.txt.
 * Set NEXT_PUBLIC_SITE_URL in the hosting provider's env vars once the
 * domain is connected; localhost is only a development fallback.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
).replace(/\/$/, '');

// Fallback only — the live value comes from Supabase app_config.telegram_url
// (see lib/settings.ts). This is what renders if Supabase isn't connected.
export const TELEGRAM_URL = 'https://t.me/your_channel';

// Fallback only — the live list comes from the Supabase `platforms` table
// (see lib/settings.ts), where rows can be added, reordered, or disabled.
// Entries with href '#' are filtered out so no dead buttons ever render.
export const PLATFORM_LINKS = [
  {key: 'x', label: 'X / Twitter', href: '#'},
  {key: 'discord', label: 'Discord', href: '#'},
  {key: 'tiktok', label: 'TikTok', href: '#'}
] as const;

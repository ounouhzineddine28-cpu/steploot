import type {MetadataRoute} from 'next';
import {routing} from '@/i18n/routing';
import {getAllArticles} from '@/lib/articles';
import {SITE_URL} from '@/lib/site';

// Pages that exist for every locale, with their relative priority.
const STATIC_PAGES: Array<{path: string; priority: number}> = [
  {path: '', priority: 1},
  {path: '/products', priority: 0.7},
  {path: '/codes', priority: 0.6},
  {path: '/about', priority: 0.4},
  {path: '/privacy', priority: 0.3},
  {path: '/terms', priority: 0.3}
];

// Rebuilt on the same cadence as the article pages.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of routing.locales) {
    for (const page of STATIC_PAGES) {
      entries.push({
        url: `${SITE_URL}/${locale}${page.path}`,
        lastModified: now,
        changeFrequency: page.path === '' ? 'daily' : 'monthly',
        priority: page.priority
      });
    }

    const articles = await getAllArticles(locale);
    for (const article of articles) {
      entries.push({
        url: `${SITE_URL}/${locale}/article/${article.slug}`,
        lastModified: article.publishedAt ? new Date(article.publishedAt) : now,
        changeFrequency: 'weekly',
        priority: 0.8
      });
    }
  }

  return entries;
}

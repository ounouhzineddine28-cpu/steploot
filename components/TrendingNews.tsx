import {getLocale, getTranslations} from 'next-intl/server';
import type {Locale} from '@/i18n/routing';
import {Link} from '@/i18n/navigation';
import {getTrendingArticles} from '@/lib/articles';
import Icon from './Icon';
import SectionHeading from './SectionHeading';

/*
  Reads real articles from Supabase via lib/articles.ts (falls back to demo
  data automatically until Supabase is connected — see lib/supabase.ts).
  Featured card = the article marked `featured` in the database (or, if none
  is marked, simply the first result).
*/
export default async function TrendingNews() {
  const t = await getTranslations('trending');
  const locale = (await getLocale()) as Locale;
  const items = await getTrendingArticles(locale, 6);

  return (
    <section id="trending" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 md:py-20">
      <SectionHeading kicker={t('kicker')} title={t('title')} />

      {items.length === 0 && (
        <p className="rounded-xl bg-bg-raised px-6 py-10 text-center text-sm text-text-dim">
          {t('empty')}
        </p>
      )}

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item, index) => {
          const isFeatured = item.featured || index === 0;

          return (
            <article
              key={item.slug}
              className={`group relative flex flex-col rounded-xl bg-bg-raised p-6 transition-colors hover:bg-bg-raised-2 ${
                isFeatured ? 'md:col-span-2 md:p-8 lg:row-span-2' : ''
              }`}
            >
              <div className="mb-3 flex items-center gap-2">
                <span className="font-mono text-[11px] text-accent">{item.category}</span>
                {isFeatured && (
                  <span className="font-mono text-[11px] text-accent-2">· {t('featured')}</span>
                )}
              </div>

              <h3
                className={`font-bold leading-snug transition-colors group-hover:text-accent ${
                  isFeatured ? 'text-xl md:text-3xl' : 'text-lg'
                }`}
              >
                <Link href={`/article/${item.slug}`} className="after:absolute after:inset-0">
                  {item.title}
                </Link>
              </h3>

              <p
                className={`mt-2 text-sm leading-relaxed text-text-dim ${
                  isFeatured ? 'line-clamp-3 md:text-base' : 'line-clamp-2'
                }`}
              >
                {item.excerpt}
              </p>

              <div className="mt-auto flex items-center gap-2 pt-4 font-mono text-xs text-text-faint">
                <Icon name="clock" className="size-3.5" />
                <span>{item.date}</span>
                <span aria-hidden="true">•</span>
                <span>{item.readTime}</span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

import {getLocale, getTranslations} from 'next-intl/server';
import type {Locale} from '@/i18n/routing';
import {Link} from '@/i18n/navigation';
import {getTrendingArticles, type ArticleSummary} from '@/lib/articles';
import {getCardLayout} from '@/lib/settings';
import Icon from './Icon';
import SectionHeading from './SectionHeading';

/*
  Homepage article grid.

  Four layout templates, switched from the admin panel (app_config.card_style)
  without touching code:
    featured — one large card then a grid  (default)
    grid     — every card the same size
    list     — horizontal rows with a small thumbnail
    news     — bare image with the headline underneath, no card chrome
               (what news portals use: picture and headline carry the page)

  Order follows articles.sort_order ascending, then newest first, so a story
  can be pinned to the top from the editor.

  Card image height (px) and column count are settings too, so the boxes can be
  sized exactly rather than by a fixed aspect ratio.
*/

// Written out in full because Tailwind only ships classes it can see in source.
const COLUMNS: Record<2 | 3 | 4, string> = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4'
};

function Meta({item}: {item: ArticleSummary}) {
  return (
    <div className="flex items-center gap-2 font-mono text-xs text-text-faint">
      <Icon name="clock" className="size-3.5" />
      <span>{item.date}</span>
      <span aria-hidden="true">•</span>
      <span>{item.readTime}</span>
    </div>
  );
}

/* featured / grid — boxed card */
function Card({
  item,
  size,
  imageHeight
}: {
  item: ArticleSummary;
  size: 'big' | 'normal';
  imageHeight: number;
}) {
  const isBig = size === 'big';

  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-xl bg-bg-raised transition-colors hover:bg-bg-raised-2 ${
        isBig ? 'md:col-span-2 lg:row-span-2' : ''
      }`}
    >
      {item.coverImageUrl && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={item.coverImageUrl}
          alt=""
          loading="lazy"
          decoding="async"
          style={{height: isBig ? Math.round(imageHeight * 1.5) : imageHeight}}
          className="w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      )}

      <div className={`flex flex-1 flex-col ${isBig ? 'p-6 md:p-8' : 'p-6'}`}>
        <div className="mb-3 flex items-center gap-2">
          <span className="font-mono text-[11px] text-accent">{item.category}</span>
          {item.featured && <span className="font-mono text-[11px] text-accent-2">· ★</span>}
        </div>

        <h3
          className={`font-bold leading-snug transition-colors group-hover:text-accent ${
            isBig ? 'text-xl md:text-3xl' : 'text-lg'
          }`}
        >
          <Link href={`/article/${item.slug}`} className="after:absolute after:inset-0">
            {item.title}
          </Link>
        </h3>

        <p
          className={`mt-2 text-sm leading-relaxed text-text-dim ${
            isBig ? 'line-clamp-3 md:text-base' : 'line-clamp-2'
          }`}
        >
          {item.excerpt}
        </p>

        <div className="mt-auto pt-4">
          <Meta item={item} />
        </div>
      </div>
    </article>
  );
}

/* list — horizontal row */
function Row({item}: {item: ArticleSummary}) {
  return (
    <article className="group relative flex items-center gap-5 rounded-xl bg-bg-raised p-4 transition-colors hover:bg-bg-raised-2">
      {item.coverImageUrl && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={item.coverImageUrl}
          alt=""
          loading="lazy"
          decoding="async"
          className="hidden aspect-[3/2] w-40 shrink-0 rounded-lg object-cover sm:block"
        />
      )}

      <div className="min-w-0 flex-1">
        <span className="font-mono text-[11px] text-accent">{item.category}</span>
        <h3 className="mt-1.5 text-lg font-bold leading-snug transition-colors group-hover:text-accent">
          <Link href={`/article/${item.slug}`} className="after:absolute after:inset-0">
            {item.title}
          </Link>
        </h3>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-text-dim">{item.excerpt}</p>
        <div className="mt-3">
          <Meta item={item} />
        </div>
      </div>
    </article>
  );
}

/* news — image, headline underneath, nothing framing them */
function NewsCard({item, imageHeight}: {item: ArticleSummary; imageHeight: number}) {
  return (
    <article className="group relative flex flex-col">
      {item.coverImageUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={item.coverImageUrl}
          alt=""
          loading="lazy"
          decoding="async"
          style={{height: imageHeight}}
          className="w-full rounded-lg object-cover"
        />
      ) : (
        <div style={{height: imageHeight}} className="w-full rounded-lg bg-bg-raised" />
      )}

      <span className="mt-3.5 font-mono text-[11px] text-accent">{item.category}</span>

      <h3 className="mt-1.5 text-lg font-bold leading-snug transition-colors group-hover:text-accent md:text-xl">
        <Link href={`/article/${item.slug}`} className="after:absolute after:inset-0">
          {item.title}
        </Link>
      </h3>

      <div className="mt-2.5">
        <Meta item={item} />
      </div>
    </article>
  );
}

export default async function TrendingNews() {
  const t = await getTranslations('trending');
  const locale = (await getLocale()) as Locale;

  const [items, layout] = await Promise.all([getTrendingArticles(locale, 6), getCardLayout()]);
  const {style, imageHeight, columns} = layout;

  return (
    <section id="trending" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 md:py-20">
      <SectionHeading kicker={t('kicker')} title={t('title')} />

      {items.length === 0 && (
        <p className="rounded-xl bg-bg-raised px-6 py-10 text-center text-sm text-text-dim">
          {t('empty')}
        </p>
      )}

      {style === 'news' && (
        <div className={`grid gap-x-6 gap-y-10 ${COLUMNS[columns]}`}>
          {items.map((item) => (
            <NewsCard key={item.slug} item={item} imageHeight={imageHeight} />
          ))}
        </div>
      )}

      {style === 'list' && (
        <div className="flex flex-col gap-4">
          {items.map((item) => (
            <Row key={item.slug} item={item} />
          ))}
        </div>
      )}

      {(style === 'featured' || style === 'grid') && (
        <div className={`grid gap-5 ${COLUMNS[columns]}`}>
          {items.map((item, index) => (
            <Card
              key={item.slug}
              item={item}
              imageHeight={imageHeight}
              size={style === 'featured' && (item.featured || index === 0) ? 'big' : 'normal'}
            />
          ))}
        </div>
      )}
    </section>
  );
}

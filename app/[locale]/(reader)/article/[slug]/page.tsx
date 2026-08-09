import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import {setRequestLocale} from 'next-intl/server';
import type {Locale} from '@/i18n/routing';
import {routing} from '@/i18n/routing';
import {getAllArticles, getArticleBySlug} from '@/lib/articles';
import ArticleBody from '@/components/ArticleBody';
import ExpandableArticle from '@/components/ExpandableArticle';

// Pre-render the articles that exist at build time (from Supabase when it's
// connected, demo slugs otherwise). Anything published later renders on first
// request and is then cached — no rebuild needed.
export async function generateStaticParams() {
  const perLocale = await Promise.all(
    routing.locales.map(async (locale) => {
      const articles = await getAllArticles(locale);
      return articles.map((article) => ({locale, slug: article.slug}));
    })
  );
  return perLocale.flat();
}

export const revalidate = 3600; // re-check Supabase hourly

export async function generateMetadata(props: {
  params: Promise<{locale: string; slug: string}>;
}): Promise<Metadata> {
  const {locale, slug} = await props.params;
  const article = await getArticleBySlug(locale as Locale, slug);
  if (!article) return {};

  return {
    title: article.title,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: 'article',
      images: article.coverImageUrl ? [article.coverImageUrl] : undefined
    }
  };
}

export default async function ArticlePage({
  params
}: {
  params: Promise<{locale: string; slug: string}>;
}) {
  const {locale, slug} = await params;
  setRequestLocale(locale);

  const article = await getArticleBySlug(locale as Locale, slug);
  if (!article) notFound();

  return (
    <article className="mx-auto max-w-2xl px-4 py-16 md:py-24">
      <header>
        <p className="font-mono text-[11px] text-accent-2">{article.category}</p>

        <h1 className="mt-4 font-serif text-[2.1rem] font-bold leading-[1.3] md:text-[2.9rem]">
          {article.title}
        </h1>

        <p className="mt-6 font-serif text-lg leading-relaxed text-text-dim md:text-xl">
          {article.excerpt}
        </p>

        <div className="mt-8 flex items-center gap-2 border-t border-border pt-4 font-mono text-[11px] text-text-faint">
          <span>{article.date}</span>
          <span aria-hidden="true">·</span>
          <span>{article.readTime}</span>
        </div>
      </header>

      {article.coverImageUrl && (
        <figure className="mt-10 lg:-mx-12">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={article.coverImageUrl}
            alt={article.title}
            className="w-full rounded-lg border border-border bg-bg-raised object-cover"
          />
        </figure>
      )}

      <div className="mt-12">
        <ExpandableArticle>
          <ArticleBody content={article.content} />
        </ExpandableArticle>
      </div>
    </article>
  );
}

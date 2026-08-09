import {getTranslations, setRequestLocale} from 'next-intl/server';
import ArticleBody from '@/components/ArticleBody';

export default async function AboutPage({
  params
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  setRequestLocale(locale);
  const t = await getTranslations('about');

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 md:py-20">
      <h1 className="text-3xl font-extrabold md:text-4xl">{t('title')}</h1>
      <div className="mt-6">
        <ArticleBody content={t('body')} variant="page" />
      </div>
    </div>
  );
}

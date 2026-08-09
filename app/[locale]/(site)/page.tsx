import {setRequestLocale} from 'next-intl/server';
import Hero from '@/components/Hero';
import TrendingNews from '@/components/TrendingNews';
import ExtrasCryptoNews from '@/components/ExtrasCryptoNews';

/*
  Homepage — revised structure (see AGENTS.md):
  Header, Hero, Trending News, Extras & Crypto News, Footer.
  Header/Footer live in the locale layout; Products and the codes strip
  are intentionally NOT homepage sections.
*/
export default async function HomePage({
  params
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  setRequestLocale(locale);

  return (
    <>
      <Hero />
      <TrendingNews />
      <ExtrasCryptoNews />
    </>
  );
}

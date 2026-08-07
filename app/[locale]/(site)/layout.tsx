// Content edited in Supabase (articles + site_content) goes live within 10 minutes.
export const revalidate = 600;

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {getPlatforms, getTelegramUrl} from '@/lib/settings';

// Chrome for everything except article pages.
export default async function SiteLayout({children}: {children: React.ReactNode}) {
  const [telegramUrl, platforms] = await Promise.all([getTelegramUrl(), getPlatforms()]);

  return (
    <div className="flex min-h-dvh flex-col">
      <Header telegramUrl={telegramUrl} />
      <main className="flex-1">{children}</main>
      <Footer telegramUrl={telegramUrl} platforms={platforms} />
    </div>
  );
}

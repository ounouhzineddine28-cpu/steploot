// Content edited in Supabase (articles + site_content) goes live within 10 minutes.
export const revalidate = 600;

import {getTranslations, setRequestLocale} from 'next-intl/server';
import {Link} from '@/i18n/navigation';
import {TELEGRAM_URL} from '@/lib/site';
import ThemeToggle from '@/components/ThemeToggle';

/*
  Reader chrome — deliberately unlike the rest of the site: white paper
  instead of the beige page, no navigation, no language pills, no big footer.
  Opening an article should feel like opening a different publication.

  (No LocaleSwitcher here on purpose: slugs differ per locale, so swapping the
  locale on an article URL would 404 until translated slugs are linked —
  see tasks.md.)
*/
export default async function ReaderLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}) {
  // Layouts render before pages, so the locale has to be pinned HERE — not
  // only in the page. Without it, getTranslations() falls back to reading
  // request headers, which makes the whole route dynamic and turns a missing
  // article into a 500 instead of a 404.
  const {locale} = await params;
  setRequestLocale(locale);

  const t = await getTranslations('article');

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <Link href="/" className="text-sm font-bold tracking-tight">
            step<span className="text-accent">loot</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="font-mono text-xs text-text-faint transition-colors hover:text-accent"
            >
              {t('back')}
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-between gap-2 px-4 py-6 font-mono text-xs text-text-faint">
          <span>© {new Date().getFullYear()} steploot</span>
          <a
            href={TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-accent"
          >
            Telegram
          </a>
        </div>
      </footer>
    </div>
  );
}

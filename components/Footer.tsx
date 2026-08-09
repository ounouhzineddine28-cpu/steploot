import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';
import {SITE_NAME} from '@/lib/site';
import type {Platform} from '@/lib/settings';

const linkClass = 'text-text-dim transition-colors hover:text-accent';

export default function Footer({
  telegramUrl,
  platforms
}: {
  telegramUrl: string;
  platforms: Platform[];
}) {
  const t = useTranslations('footer');
  const th = useTranslations('header');
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-full bg-accent font-mono text-xs font-bold text-bg">
              SL
            </span>
            <span className="text-lg font-extrabold tracking-tight">
              step<span className="text-accent">loot</span>
            </span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-text-dim">
            {t('tagline')}
          </p>
        </div>

        <div>
          <h3 className="kicker mb-4 font-mono text-xs text-text-faint">
            {t('quickLinks')}
          </h3>
          <ul className="flex flex-col gap-2.5 text-sm">
            <li>
              <Link href="/" className={linkClass}>
                {th('home')}
              </Link>
            </li>
            <li>
              <Link href="/products" className={linkClass}>
                {th('products')}
              </Link>
            </li>
            <li>
              <Link href="/about" className={linkClass}>
                {th('about')}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="kicker mb-4 font-mono text-xs text-text-faint">
            {t('legal')}
          </h3>
          <ul className="flex flex-col gap-2.5 text-sm">
            <li>
              <Link href="/privacy" className={linkClass}>
                {t('privacy')}
              </Link>
            </li>
            <li>
              <Link href="/terms" className={linkClass}>
                {t('terms')}
              </Link>
            </li>
          </ul>

          <h3 className="kicker mb-4 mt-6 font-mono text-xs text-text-faint">
            {t('platforms')}
          </h3>
          <ul className="flex flex-col gap-2.5 text-sm">
            <li>
              <a
                href={telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                Telegram
              </a>
            </li>
            {platforms.map((platform) => (
              <li key={platform.key}>
                <a
                  href={platform.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  {platform.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-5 font-mono text-xs text-text-faint">
          <span>
            © {year} {SITE_NAME}
          </span>
          <span>{t('rights')}</span>
        </div>
      </div>
    </footer>
  );
}

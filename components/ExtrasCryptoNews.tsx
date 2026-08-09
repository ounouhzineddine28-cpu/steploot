import {getLocale, getTranslations} from 'next-intl/server';
import type {Locale} from '@/i18n/routing';
import {Link} from '@/i18n/navigation';
import {getArticlesByCategory} from '@/lib/articles';
import {getCryptoCategory, getPlatforms, getTelegramUrl} from '@/lib/settings';
import Icon from './Icon';
import SectionHeading from './SectionHeading';

/*
  Third homepage section. Everything here is data-driven:
    - crypto list  → published articles whose category matches
                     app_config.crypto_category (default 'crypto'),
                     each row links to its article
    - Telegram CTA → app_config.telegram_url
    - platform buttons → the `platforms` table (add/remove rows freely)
*/
export default async function ExtrasCryptoNews() {
  const t = await getTranslations('extras');
  const locale = (await getLocale()) as Locale;

  const category = await getCryptoCategory();
  const [items, platforms, telegramUrl] = await Promise.all([
    getArticlesByCategory(locale, category, 4),
    getPlatforms(),
    getTelegramUrl()
  ]);

  return (
    <section id="extras" className="border-t border-border">
      <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <SectionHeading kicker={t('kicker')} title={t('title')} />

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Crypto news — real articles */}
          <div className="rounded-xl bg-bg-raised lg:col-span-2">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h3 className="font-bold">{t('cryptoHeading')}</h3>
              <span className="flex items-center gap-2 font-mono text-[11px] text-accent">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
                  <span className="relative inline-flex size-2 rounded-full bg-accent" />
                </span>
                {t('live')}
              </span>
            </div>

            {items.length === 0 ? (
              <p className="px-5 py-6 text-sm text-text-dim">{t('cryptoEmpty')}</p>
            ) : (
              <ul className="divide-y divide-border">
                {items.map((item) => (
                  <li key={item.slug}>
                    <Link
                      href={`/article/${item.slug}`}
                      className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-bg-raised-2"
                    >
                      <span className="w-14 shrink-0 rounded-md border border-accent-2/25 bg-accent-2/10 px-1.5 py-1 text-center font-mono text-[11px] font-medium text-accent-2">
                        {item.tag || item.category}
                      </span>
                      <span className="flex-1 text-sm font-medium leading-snug">{item.title}</span>
                      <span className="shrink-0 font-mono text-xs text-text-faint">{item.date}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Community */}
          <div className="flex flex-col gap-6">
            <div className="rounded-xl bg-bg-raised-2 p-6">
              <div className="mb-4 grid size-11 place-items-center rounded-xl bg-accent/15 text-accent">
                <Icon name="send" className="size-5" />
              </div>
              <h3 className="text-lg font-bold">{t('telegramTitle')}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-text-dim">{t('telegramDesc')}</p>
              <a
                href={telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-accent px-4 py-3 font-bold text-bg transition hover:brightness-110"
              >
                <Icon name="send" className="size-4" />
                {t('telegramCta')}
              </a>
            </div>

            {platforms.length > 0 && (
              <div className="rounded-xl bg-bg-raised p-6">
                <h3 className="mb-4 text-sm font-bold text-text-dim">{t('othersHeading')}</h3>
                <div className="flex flex-col gap-2">
                  {platforms.map((platform) => (
                    <a
                      key={platform.key}
                      href={platform.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-lg border border-border px-4 py-2.5 font-mono text-sm text-text-dim transition-colors hover:border-accent/50 hover:text-accent"
                    >
                      {platform.label}
                      <Icon name="external" className="size-4 rtl:-scale-x-100" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

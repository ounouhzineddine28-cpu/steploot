import {getTranslations} from 'next-intl/server';
import {getTelegramUrl} from '@/lib/settings';

/*
  Minimal hero: type and whitespace only — no grid, no glow, no decoration.
  The one visual move is the hairline rule pairing the headline with the badges.
*/
export default async function Hero() {
  const t = await getTranslations('hero');
  const telegramUrl = await getTelegramUrl();

  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
        <p className="kicker font-mono text-[11px] text-accent-2">{t('kicker')}</p>

        <h1 className="mt-5 max-w-3xl text-4xl font-extrabold leading-[1.2] md:text-6xl">
          {t('titleA')} <span className="text-accent">{t('titleAccent')}</span> {t('titleB')}
        </h1>

        <p className="mt-6 max-w-xl text-base leading-relaxed text-text-dim md:text-lg">
          {t('subtitle')}
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-5">
          <a
            href="#trending"
            className="rounded-full bg-accent px-7 py-3 font-bold text-bg transition hover:brightness-110"
          >
            {t('ctaPrimary')}
          </a>
          <a
            href={telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-text-dim underline decoration-border underline-offset-8 transition-colors hover:text-accent hover:decoration-accent"
          >
            {t('ctaSecondary')}
          </a>
        </div>

        <div className="mt-14 flex flex-wrap gap-x-8 gap-y-2 border-t border-border pt-5 font-mono text-[11px] text-text-faint">
          <span>{t('badge1')}</span>
          <span>{t('badge2')}</span>
          <span>{t('badge3')}</span>
        </div>
      </div>
    </section>
  );
}

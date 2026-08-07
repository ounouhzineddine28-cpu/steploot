'use client';

import {useState} from 'react';
import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';
import Icon from './Icon';
import LocaleSwitcher from './LocaleSwitcher';

const NAV = [
  {key: 'home', href: '/'},
  {key: 'products', href: '/products'},
  {key: 'about', href: '/about'}
] as const;

export default function Header({telegramUrl}: {telegramUrl: string}) {
  const t = useTranslations('header');
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link
          href="/"
          className="flex items-center gap-2.5"
          onClick={() => setOpen(false)}
        >
          <span className="grid size-8 place-items-center rounded-full bg-accent font-mono text-xs font-bold text-bg">
            SL
          </span>
          <span className="text-lg font-extrabold tracking-tight">
            step<span className="text-accent">loot</span>
          </span>
          {/* Says what the site is to a first-time visitor without turning the
              brand itself into a generic phrase. Hidden on narrow screens. */}
          {t('tagline').trim() && (
            <span className="hidden text-xs text-text-dim sm:inline">
              <span className="mx-1.5 text-text-faint" aria-hidden="true">
                ·
              </span>
              {t('tagline')}
            </span>
          )}
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Main">
          {NAV.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className="text-sm font-medium text-text-dim transition-colors hover:text-text"
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <LocaleSwitcher />
          <a
            href={telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-bold text-bg transition hover:brightness-110"
          >
            <Icon name="send" className="size-4" />
            {t('telegram')}
          </a>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? t('closeMenu') : t('openMenu')}
          className="grid size-10 place-items-center rounded-full border border-border text-text md:hidden"
        >
          <Icon name={open ? 'close' : 'menu'} className="size-5" />
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-bg md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4" aria-label="Mobile">
            {NAV.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-text-dim hover:bg-bg-raised hover:text-text"
              >
                {t(item.key)}
              </Link>
            ))}
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-4">
              <LocaleSwitcher />
              <a
                href={telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-bold text-bg"
              >
                <Icon name="send" className="size-4" />
                {t('telegram')}
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

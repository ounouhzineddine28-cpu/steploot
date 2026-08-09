'use client';

import {useLocale} from 'next-intl';
import {usePathname, useRouter} from '@/i18n/navigation';
import {routing} from '@/i18n/routing';
import ThemeToggle from './ThemeToggle';

export default function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  return (
    /* Languages and the theme switch share one control, so wherever the
       switcher appears the theme button comes with it. */
    <div className="flex items-center gap-1 rounded-full border border-border p-1">
      <div role="group" aria-label="Language" className="flex items-center font-mono text-xs">
        {routing.locales.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => router.replace(pathname, {locale: l})}
            aria-current={l === locale ? 'true' : undefined}
            className={`rounded-full px-2.5 py-1 uppercase transition-colors ${
              l === locale
                ? 'bg-accent font-semibold text-bg'
                : 'text-text-dim hover:text-text'
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      <span className="h-4 w-px bg-border" aria-hidden="true" />
      <ThemeToggle variant="inline" />
    </div>
  );
}

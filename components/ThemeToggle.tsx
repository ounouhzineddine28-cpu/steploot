'use client';

import {useTranslations} from 'next-intl';
import Icon from './Icon';

/*
  Dark-mode switch.

  The icons are swapped with the `dark:` variant rather than React state, so
  the button renders identically on the server and the client — no hydration
  mismatch and no flash of the wrong icon. The actual theme is applied by the
  inline script in the root layout before first paint; this button only
  toggles the class and records the preference.

  Removing the stored value would fall back to the OS setting, but a manual
  choice is intentionally sticky once made.
*/
export default function ThemeToggle({
  variant = 'standalone'
}: {
  /** 'inline' drops the border — for sitting inside another pill control. */
  variant?: 'standalone' | 'inline';
}) {
  const t = useTranslations('theme');

  function toggle() {
    const root = document.documentElement;
    const dark = root.classList.toggle('dark');
    try {
      localStorage.setItem('theme', dark ? 'dark' : 'light');
    } catch {
      // private mode / storage blocked — the theme still applies for this page
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t('toggle')}
      title={t('toggle')}
      className={
        variant === 'inline'
          ? 'grid size-7 place-items-center rounded-full text-text-faint transition-colors hover:text-accent'
          : 'grid size-9 place-items-center rounded-full border border-border text-text-dim transition-colors hover:text-accent'
      }
    >
      <Icon name="moon" className="size-4 dark:hidden" />
      <Icon name="sun" className="hidden size-4 dark:block" />
    </button>
  );
}

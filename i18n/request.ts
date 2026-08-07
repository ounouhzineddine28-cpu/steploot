import {getRequestConfig} from 'next-intl/server';
import {hasLocale} from 'next-intl';
import {routing, type Locale} from './routing';
import {applyOverrides, getContentOverrides} from '@/lib/site-content';

export default getRequestConfig(async ({requestLocale}) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  // Repo defaults, then any per-string overrides stored in Supabase.
  const defaults = (await import(`../messages/${locale}.json`)).default;
  const overrides = await getContentOverrides(locale as Locale);

  return {
    locale,
    messages: applyOverrides(defaults, overrides)
  };
});

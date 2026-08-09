import {getTranslations, setRequestLocale} from 'next-intl/server';
import type {Locale} from '@/i18n/routing';
import {getProducts} from '@/lib/products';
import Icon from '@/components/Icon';

/*
  Standalone affiliate products page (NOT a homepage section — see AGENTS.md).
  Managed from the admin panel → "المنتجات" tab.
*/
export default async function ProductsPage({
  params
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  setRequestLocale(locale);

  const t = await getTranslations('products');
  const products = await getProducts(locale as Locale);

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 md:py-20">
      <p className="kicker mb-2 font-mono text-xs font-medium text-accent">{t('kicker')}</p>
      <h1 className="text-3xl font-extrabold md:text-4xl">{t('title')}</h1>
      <p className="mt-3 max-w-2xl text-text-dim">{t('subtitle')}</p>
      <p className="mt-4 inline-block rounded-lg bg-bg-raised px-3 py-2 font-mono text-xs text-text-faint">
        {t('disclosure')}
      </p>

      {products.length === 0 ? (
        <p className="mt-10 rounded-xl bg-bg-raised px-6 py-10 text-center text-sm text-text-dim">
          {t('empty')}
        </p>
      ) : (
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <article
              key={product.id}
              className="group flex flex-col rounded-xl bg-bg-raised p-6 transition-colors hover:bg-bg-raised-2"
            >
              {product.imageUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  loading="lazy"
                  className="aspect-video w-full rounded-lg border border-border object-cover"
                />
              ) : (
                <div className="grid aspect-video place-items-center rounded-lg border border-border bg-bg-raised-2 font-mono text-xs text-text-faint">
                  IMG
                </div>
              )}

              <h2 className="mt-4 text-lg font-bold leading-snug">{product.name}</h2>
              {product.blurb && <p className="mt-1.5 text-sm text-text-dim">{product.blurb}</p>}

              <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                {product.price && (
                  <span className="font-mono text-lg font-semibold text-accent-2">{product.price}</span>
                )}
                {product.affiliateUrl && (
                  <a
                    href={product.affiliateUrl}
                    target="_blank"
                    rel="nofollow sponsored noopener noreferrer"
                    className="flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-bold text-bg transition hover:brightness-110"
                  >
                    {t('cta')}
                    <Icon name="external" className="size-3.5 rtl:-scale-x-100" />
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

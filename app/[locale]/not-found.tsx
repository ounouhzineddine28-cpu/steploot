/*
  404 boundary inside the [locale] segment.

  Without this, notFound() from an article page falls through to the global
  not-found, which sits outside [locale] and has no locale context — that
  render fails with DYNAMIC_SERVER_USAGE and the visitor gets a 500 instead
  of a 404.

  Deliberately free of next-intl hooks: a not-found page receives no params,
  so calling for translations here would force a dynamic render. The copy is
  short and bilingual instead.
*/
export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center px-4 text-center">
      <div>
        <p className="font-mono text-sm text-accent-2">404</p>
        <h1 className="mt-4 text-2xl font-extrabold md:text-3xl">
          الصفحة غير موجودة
        </h1>
        <p className="mt-2 text-sm text-text-dim">Page not found</p>
        <a
          href="/"
          className="mt-8 inline-block rounded-full bg-accent px-6 py-3 font-bold text-bg transition hover:brightness-110"
        >
          العودة إلى الرئيسية
        </a>
      </div>
    </div>
  );
}

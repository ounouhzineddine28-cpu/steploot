import {getTranslations, setRequestLocale} from 'next-intl/server';
import type {Locale} from '@/i18n/routing';
import CodeTicket from '@/components/CodeTicket';

type DemoCode = {
  id: number;
  code: string;
  label: string;
  note?: string;
  expired?: boolean;
};

/*
  Archive page for past codes. Intentionally NOT linked from the homepage
  (see AGENTS.md) — codes are distributed inside articles; this page exists
  for reference/SEO. Static demo data below; connect to the same data source
  as the in-article code component later (tasks.md §5).
*/
const DEMO_CODES: Record<Locale, DemoCode[]> = {
  ar: [
    {id: 1, code: 'TMWEEK26', label: 'كود الأسبوع — Red Packet', note: 'افتح تطبيق Binance ثم أدخل الكود في قسم Red Packet.'},
    {id: 2, code: 'TMAI2026', label: 'كود مقال الذكاء الاصطناعي', note: 'الكمية محدودة — ينتهي عند نفادها.'},
    {id: 3, code: 'TMSTART25', label: 'كود الإطلاق', expired: true}
  ],
  en: [
    {id: 1, code: 'TMWEEK26', label: 'Code of the week — Red Packet', note: 'Open the Binance app and redeem the code in the Red Packet section.'},
    {id: 2, code: 'TMAI2026', label: 'AI article code', note: 'Limited supply — expires when it runs out.'},
    {id: 3, code: 'TMSTART25', label: 'Launch code', expired: true}
  ],
  fr: [
    {id: 1, code: 'TMWEEK26', label: 'Code de la semaine — Red Packet', note: "Ouvrez l'appli Binance et saisissez le code dans la section Red Packet."},
    {id: 2, code: 'TMAI2026', label: "Code de l'article IA", note: 'Quantité limitée — expire une fois épuisée.'},
    {id: 3, code: 'TMSTART25', label: 'Code de lancement', expired: true}
  ],
  es: [
    {id: 1, code: 'TMWEEK26', label: 'Código de la semana — Red Packet', note: 'Abre la app de Binance y canjea el código en la sección Red Packet.'},
    {id: 2, code: 'TMAI2026', label: 'Código del artículo de IA', note: 'Cantidad limitada — caduca al agotarse.'},
    {id: 3, code: 'TMSTART25', label: 'Código de lanzamiento', expired: true}
  ]
};

export default async function CodesPage({
  params
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  setRequestLocale(locale);
  const t = await getTranslations('codes');
  const codes = DEMO_CODES[locale as Locale];

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 md:py-20">
      <p className="kicker mb-2 font-mono text-xs font-medium text-accent-2">{t('kicker')}</p>
      <h1 className="text-3xl font-extrabold md:text-4xl">{t('title')}</h1>
      <p className="mt-3 max-w-2xl text-text-dim">{t('subtitle')}</p>

      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {codes.map(({id, ...ticket}) => (
          <CodeTicket key={id} {...ticket} />
        ))}
      </div>
    </div>
  );
}

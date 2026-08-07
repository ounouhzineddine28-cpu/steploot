'use client';

import {useCallback, useEffect, useState} from 'react';
import {getAdminClient} from './lib';
import {ContentArea, btn, input, label} from './editor';

const LOCALES = ['ar', 'en', 'fr', 'es'] as const;
type Loc = (typeof LOCALES)[number];

/*
  Long-form site pages. These are `site_content` rows like any other string,
  but they deserve a real editor rather than a bare textarea: the body fields
  are parsed with the same block syntax as articles, so headings, lists and
  images all work here — which is what a real privacy policy needs before
  applying to AdSense.
*/
const PAGES: Array<{
  key: string;
  title: string;
  note?: string;
  fields: Array<{key: string; label: string; long?: boolean}>;
}> = [
  {
    key: 'about',
    title: 'من نحن',
    fields: [
      {key: 'about.title', label: 'العنوان'},
      {key: 'about.body', label: 'المحتوى', long: true}
    ]
  },
  {
    key: 'privacy',
    title: 'سياسة الخصوصية',
    note: 'مطلوبة بمحتوى حقيقي قبل التقديم على AdSense',
    fields: [
      {key: 'privacy.title', label: 'العنوان'},
      {key: 'privacy.notice', label: 'تنبيه أعلى الصفحة (اتركه فارغًا لإخفائه)'},
      {key: 'privacy.body', label: 'نص السياسة', long: true}
    ]
  },
  {
    key: 'terms',
    title: 'شروط الاستخدام',
    note: 'مطلوبة بمحتوى حقيقي قبل التقديم على AdSense',
    fields: [
      {key: 'terms.title', label: 'العنوان'},
      {key: 'terms.notice', label: 'تنبيه أعلى الصفحة (اتركه فارغًا لإخفائه)'},
      {key: 'terms.body', label: 'نص الشروط', long: true}
    ]
  }
];

export default function PagesTab({notify}: {notify: (m: string) => void}) {
  const supabase = getAdminClient()!;
  const [page, setPage] = useState(PAGES[0]);
  const [locale, setLocale] = useState<Loc>('ar');
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const {data, error} = await supabase
      .from('site_content')
      .select('key, value')
      .eq('locale', locale)
      .in('key', page.fields.map((f) => f.key));

    if (error) notify(`تعذّر التحميل: ${error.message}`);

    const next: Record<string, string> = {};
    for (const field of page.fields) next[field.key] = '';
    for (const row of (data ?? []) as Array<{key: string; value: string}>) {
      next[row.key] = row.value ?? '';
    }
    setValues(next);
    setLoading(false);
  }, [locale, notify, page, supabase]);

  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    setBusy(true);
    const rows = page.fields.map((field) => ({
      key: field.key,
      locale,
      value: values[field.key] ?? ''
    }));

    const {error} = await supabase.from('site_content').upsert(rows, {onConflict: 'key,locale'});
    setBusy(false);
    notify(error ? `تعذّر الحفظ: ${error.message}` : 'تم الحفظ ✓ — يظهر في الموقع خلال 10 دقائق');
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5">
          {PAGES.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPage(p)}
              className={`rounded-full px-4 py-1.5 text-sm transition ${
                p.key === page.key ? 'bg-accent font-bold text-bg' : 'text-text-dim hover:text-text'
              }`}
            >
              {p.title}
            </button>
          ))}
        </div>

        <div className="ms-auto flex gap-1.5">
          {LOCALES.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLocale(l)}
              className={`rounded-full px-3 py-1 font-mono text-xs uppercase transition ${
                l === locale ? 'bg-accent font-bold text-bg' : 'text-text-faint hover:text-text'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {page.note && (
        <p className="mb-4 rounded-lg border border-accent-2/40 bg-accent-2/10 px-4 py-2.5 text-xs text-accent-2">
          {page.note}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-text-dim">جارٍ التحميل…</p>
      ) : (
        <div className="grid gap-5 rounded-xl bg-bg-raised p-5">
          {page.fields.map((field) => (
            <div key={field.key}>
              <label className={label}>
                {field.label}{' '}
                <code dir="ltr" className="ms-1 font-mono text-[10px] text-text-faint">
                  {field.key}
                </code>
              </label>

              {field.long ? (
                <ContentArea
                  value={values[field.key] ?? ''}
                  onChange={(v) => setValues((prev) => ({...prev, [field.key]: v}))}
                  notify={notify}
                />
              ) : (
                <input
                  className={input}
                  value={values[field.key] ?? ''}
                  onChange={(e) => setValues((prev) => ({...prev, [field.key]: e.target.value}))}
                />
              )}
            </div>
          ))}
        </div>
      )}

      <button type="button" onClick={save} disabled={busy || loading} className={`${btn} mt-6 bg-accent text-bg`}>
        {busy ? 'جارٍ الحفظ…' : 'حفظ'}
      </button>
    </div>
  );
}

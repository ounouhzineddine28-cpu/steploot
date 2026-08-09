'use client';

import {useCallback, useEffect, useState} from 'react';
import {getAdminClient} from './lib';
import {btn, input, label} from './editor';

type ConfigRow = {key: string; value: string; description: string | null};

/*
  Site settings stored in `app_config` — the values that change how the site
  behaves rather than what it says. Known keys get a proper control so the
  author never has to remember an allowed value; anything else falls back to a
  plain text field, so new keys added in SQL show up here automatically.
*/
const CHOICES: Record<string, Array<{value: string; label: string}>> = {
  card_style: [
    {value: 'featured', label: 'بطاقة كبيرة + شبكة'},
    {value: 'grid', label: 'شبكة متساوية'},
    {value: 'news', label: 'أسلوب الصحف — صورة ثم عنوان'},
    {value: 'list', label: 'قائمة صفوف'},
    {value: 'news', label: 'صورة والعنوان تحتها (بلا إطار)'}
  ],
  card_columns: [
    {value: '2', label: 'عمودان (بطاقات كبيرة)'},
    {value: '3', label: 'ثلاثة أعمدة'},
    {value: '4', label: 'أربعة أعمدة (مضغوطة)'}
  ],
  ads_enabled: [
    {value: 'false', label: 'موقوفة'},
    {value: 'true', label: 'مفعّلة'}
  ]
};

const LABELS: Record<string, string> = {
  site_name: 'اسم الموقع',
  card_style: 'قالب بطاقات الرئيسية',
  card_image_height: 'ارتفاع صورة البطاقة (بكسل)',
  card_columns: 'عدد الأعمدة',
  telegram_url: 'رابط قناة تيليجرام',
  crypto_category: 'تصنيف مقالات الكريبتو',
  contact_email: 'بريد التواصل',
  adsense_client_id: 'معرّف AdSense',
  ads_enabled: 'الإعلانات'
};

export default function SettingsTab({notify}: {notify: (m: string) => void}) {
  const supabase = getAdminClient()!;
  const [rows, setRows] = useState<ConfigRow[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const {data, error} = await supabase
      .from('app_config')
      .select('key, value, description')
      .order('key');

    if (error) notify(`تعذّر التحميل: ${error.message}`);
    setRows((data ?? []) as ConfigRow[]);
    setLoading(false);
  }, [notify, supabase]);

  useEffect(() => {
    load();
  }, [load]);

  async function save(row: ConfigRow) {
    setBusy(row.key);
    const {error} = await supabase
      .from('app_config')
      .upsert({key: row.key, value: row.value}, {onConflict: 'key'});
    setBusy(null);
    notify(error ? `تعذّر الحفظ: ${error.message}` : 'تم الحفظ ✓ — يظهر خلال 10 دقائق');
  }

  function update(key: string, value: string) {
    setRows((prev) => prev.map((r) => (r.key === key ? {...r, value} : r)));
  }

  if (loading) return <p className="text-sm text-text-dim">جارٍ التحميل…</p>;

  if (rows.length === 0) {
    return (
      <p className="rounded-xl bg-bg-raised p-5 text-sm text-text-dim">
        جدول app_config فارغ — شغّل ملف SQL الخاص بالإعدادات أولًا.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.key} className="rounded-xl bg-bg-raised p-4">
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <span className="text-sm font-medium">{LABELS[row.key] ?? row.key}</span>
            <code dir="ltr" className="font-mono text-[10px] text-text-faint">
              {row.key}
            </code>
          </div>

          {CHOICES[row.key] ? (
            <select
              className={input}
              value={row.value ?? ''}
              onChange={(e) => update(row.key, e.target.value)}
            >
              {CHOICES[row.key].map((choice) => (
                <option key={choice.value} value={choice.value}>
                  {choice.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              className={input}
              dir={row.key.endsWith('_url') || row.key.includes('email') ? 'ltr' : undefined}
              value={row.value ?? ''}
              onChange={(e) => update(row.key, e.target.value)}
            />
          )}

          {row.description && (
            <p className="mt-2 text-[11px] leading-relaxed text-text-faint">{row.description}</p>
          )}

          <button
            type="button"
            onClick={() => save(row)}
            disabled={busy === row.key}
            className={`${btn} mt-3 bg-accent px-3 py-1.5 text-xs text-bg`}
          >
            {busy === row.key ? '…' : 'حفظ'}
          </button>
        </div>
      ))}

      <p className="pt-2 text-[11px] leading-relaxed text-text-faint">
        روابط المنصات (X · Discord · TikTok…) تُدار من جدول <code dir="ltr">platforms</code> في Supabase.
      </p>
    </div>
  );
}

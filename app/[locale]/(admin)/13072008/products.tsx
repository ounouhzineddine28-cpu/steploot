'use client';

import {useCallback, useEffect, useState} from 'react';
import {getAdminClient} from './lib';
import {CardPreview, ImageField, btn, input, label} from './editor';

const LOCALES = ['ar', 'en', 'fr', 'es'] as const;
type Loc = (typeof LOCALES)[number];

type ProductRow = {
  id: string;
  price: string | null;
  image_url: string | null;
  affiliate_url: string | null;
  sort_order: number;
  status: 'draft' | 'published';
};

type ProductTranslation = {
  product_id: string;
  locale: string;
  name: string;
  blurb: string;
};

const EMPTY_TRANSLATION = (locale: Loc): ProductTranslation => ({
  product_id: '',
  locale,
  name: '',
  blurb: ''
});

const EMPTY_PRODUCT: ProductRow = {
  id: '',
  price: '',
  image_url: null,
  affiliate_url: '',
  sort_order: 100,
  status: 'draft'
};

export default function ProductsTab({notify}: {notify: (m: string) => void}) {
  const supabase = getAdminClient()!;
  const [rows, setRows] = useState<Array<ProductRow & {name: string | null}>>([]);
  const [editing, setEditing] = useState<string | 'new' | null>(null);

  const load = useCallback(async () => {
    const {data, error} = await supabase
      .from('products')
      .select('id, price, image_url, affiliate_url, sort_order, status, product_translations(locale, name)')
      .order('sort_order', {ascending: true});

    if (error) {
      notify(`تعذّر التحميل: ${error.message}`);
      return;
    }

    setRows(
      ((data ?? []) as Array<ProductRow & {product_translations: Array<{locale: string; name: string}>}>).map(
        ({product_translations, ...p}) => ({
          ...p,
          name:
            product_translations?.find((t) => t.locale === 'ar')?.name ??
            product_translations?.[0]?.name ??
            null
        })
      )
    );
  }, [notify, supabase]);

  useEffect(() => {
    load();
  }, [load]);

  if (editing) {
    return (
      <Editor
        id={editing}
        notify={notify}
        onClose={() => {
          setEditing(null);
          load();
        }}
      />
    );
  }

  return (
    <div>
      <button type="button" onClick={() => setEditing('new')} className={`${btn} mb-5 bg-accent text-bg`}>
        + منتج جديد
      </button>

      <div className="divide-y divide-border rounded-xl bg-bg-raised">
        {rows.length === 0 && (
          <p className="p-5 text-sm text-text-dim">
            لا توجد منتجات بعد. إذا لم يظهر شيء بعد الإضافة، تأكد من تشغيل ملف SQL الخاص بالمنتجات.
          </p>
        )}
        {rows.map((row) => (
          <button
            key={row.id}
            type="button"
            onClick={() => setEditing(row.id)}
            className="flex w-full items-center gap-3 px-5 py-3.5 text-start hover:bg-bg-raised-2"
          >
            <span
              className={`font-mono text-[10px] ${
                row.status === 'published' ? 'text-accent' : 'text-text-faint'
              }`}
            >
              {row.status === 'published' ? '●' : '○'}
            </span>
            <span className="flex-1 truncate text-sm">{row.name ?? '(بلا اسم)'}</span>
            {row.price && <span className="font-mono text-xs text-accent-2">{row.price}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

function Editor({
  id,
  notify,
  onClose
}: {
  id: string | 'new';
  notify: (m: string) => void;
  onClose: () => void;
}) {
  const supabase = getAdminClient()!;
  const [product, setProduct] = useState<ProductRow>(EMPTY_PRODUCT);
  const [locale, setLocale] = useState<Loc>('ar');
  const [translations, setTranslations] = useState<Record<Loc, ProductTranslation>>(
    Object.fromEntries(LOCALES.map((l) => [l, EMPTY_TRANSLATION(l)])) as Record<Loc, ProductTranslation>
  );
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (id === 'new') return;
    (async () => {
      const {data} = await supabase
        .from('products')
        .select('*, product_translations(*)')
        .eq('id', id)
        .single();
      if (!data) return;

      const {product_translations, ...rest} = data as ProductRow & {
        product_translations: ProductTranslation[];
      };
      setProduct(rest);
      setTranslations((prev) => {
        const next = {...prev};
        for (const l of LOCALES) {
          next[l] = product_translations?.find((t) => t.locale === l) ?? EMPTY_TRANSLATION(l);
        }
        return next;
      });
    })();
  }, [id, supabase]);

  const tr = translations[locale];
  const setTr = (patch: Partial<ProductTranslation>) =>
    setTranslations((prev) => ({...prev, [locale]: {...prev[locale], ...patch}}));

  async function save() {
    setBusy(true);
    try {
      const payload = {
        price: product.price || null,
        image_url: product.image_url || null,
        affiliate_url: product.affiliate_url || null,
        sort_order: Number(product.sort_order) || 100,
        status: product.status
      };

      let productId = product.id;
      if (id === 'new' || !productId) {
        const {data, error} = await supabase.from('products').insert(payload).select('id').single();
        if (error) throw error;
        productId = (data as {id: string}).id;
        setProduct((p) => ({...p, id: productId}));
      } else {
        const {error} = await supabase.from('products').update(payload).eq('id', productId);
        if (error) throw error;
      }

      const filled = LOCALES.map((l) => translations[l]).filter((t) => t.name.trim());
      if (filled.length > 0) {
        const {error} = await supabase
          .from('product_translations')
          .upsert(
            filled.map((t) => ({...t, product_id: productId})),
            {onConflict: 'product_id,locale'}
          );
        if (error) throw error;
      }

      if (filled.length === 0) {
        notify('حُفظت الإعدادات — اكتب اسم المنتج في لغة واحدة على الأقل');
      } else if (product.status === 'draft') {
        notify('تم الحفظ كمسودة — غيّر الحالة إلى "منشور" ليظهر في الموقع');
      } else {
        notify('تم النشر ✓');
      }
      onClose();
    } catch (e) {
      notify(`تعذّر الحفظ: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (id === 'new' || !confirm('حذف هذا المنتج وكل ترجماته؟')) return;
    const {error} = await supabase.from('products').delete().eq('id', product.id);
    notify(error ? 'تعذّر الحذف' : 'تم الحذف');
    if (!error) onClose();
  }

  return (
    <div>
      <button type="button" onClick={onClose} className="mb-5 font-mono text-xs text-text-dim hover:text-accent">
        → رجوع
      </button>

      <div className="mb-6 grid gap-4 rounded-xl bg-bg-raised p-5 sm:grid-cols-3">
        <div>
          <label className={label}>السعر</label>
          <input
            className={input}
            placeholder="$49"
            value={product.price ?? ''}
            onChange={(e) => setProduct({...product, price: e.target.value})}
          />
        </div>
        <div>
          <label className={label}>الترتيب</label>
          <input
            className={input}
            type="number"
            value={product.sort_order}
            onChange={(e) => setProduct({...product, sort_order: Number(e.target.value)})}
          />
        </div>
        <div>
          <label className={label}>الحالة</label>
          <select
            className={input}
            value={product.status}
            onChange={(e) => setProduct({...product, status: e.target.value as ProductRow['status']})}
          >
            <option value="draft">مسودة</option>
            <option value="published">منشور</option>
          </select>
          <p className="mt-1 text-[11px] text-text-faint">
            {product.status === 'draft' ? 'لن يظهر في الموقع' : 'سيظهر في الموقع'}
          </p>
        </div>

        <div className="sm:col-span-3">
          <label className={label}>رابط الشراء (أفلييت)</label>
          <input
            className={`${input} font-mono text-xs`}
            dir="ltr"
            placeholder="https://amzn.to/..."
            value={product.affiliate_url ?? ''}
            onChange={(e) => setProduct({...product, affiliate_url: e.target.value})}
          />
          <p className="mt-1 text-[11px] text-text-faint">
            يُضاف تلقائيًا rel=&quot;nofollow sponsored&quot; كما تشترط سياسات جوجل.
          </p>
        </div>

        <div className="sm:col-span-3">
          <label className={label}>صورة المنتج</label>
          <ImageField
            value={product.image_url ?? ''}
            onChange={(url) => setProduct({...product, image_url: url})}
          />

          <p className="mt-5 mb-2 text-[11px] text-text-faint">هكذا تظهر البطاقة في صفحة المنتجات:</p>
          <CardPreview
            imageUrl={product.image_url}
            title={translations[locale].name}
            excerpt={translations[locale].blurb}
            price={product.price}
          />
        </div>
      </div>

      <div className="mb-4 flex gap-1.5">
        {LOCALES.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLocale(l)}
            className={`rounded-full px-3 py-1 font-mono text-xs uppercase transition ${
              l === locale
                ? 'bg-accent font-bold text-bg'
                : translations[l].name
                  ? 'text-accent'
                  : 'text-text-faint hover:text-text'
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="grid gap-4 rounded-xl bg-bg-raised p-5">
        <div>
          <label className={label}>اسم المنتج</label>
          <input className={input} value={tr.name} onChange={(e) => setTr({name: e.target.value})} />
        </div>
        <div>
          <label className={label}>وصف قصير</label>
          <textarea
            className={`${input} h-24 resize-y`}
            value={tr.blurb}
            onChange={(e) => setTr({blurb: e.target.value})}
          />
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button type="button" onClick={save} disabled={busy} className={`${btn} bg-accent text-bg`}>
          {busy ? 'جارٍ الحفظ…' : 'حفظ'}
        </button>
        {id !== 'new' && (
          <button type="button" onClick={remove} className="text-sm text-red-700 hover:underline">
            حذف
          </button>
        )}
      </div>
    </div>
  );
}

'use client';

import {useCallback, useEffect, useState} from 'react';
import type {Session} from '@supabase/supabase-js';
import ThemeToggle from '@/components/ThemeToggle';
import {ContentArea, ImageField, btn, input, label} from './editor';
import ProductsTab from './products';
import PagesTab from './pages';
import {getAdminClient, slugifyTitle} from './lib';

const LOCALES = ['ar', 'en', 'fr', 'es'] as const;
type Loc = (typeof LOCALES)[number];

type ArticleRow = {
  id: string;
  category: string;
  tag: string | null;
  featured: boolean;
  status: 'draft' | 'published';
  published_at: string | null;
  cover_image_url: string | null;
};

type TranslationRow = {
  article_id: string;
  locale: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  read_time: string | null;
};

const EMPTY_TRANSLATION = (articleId: string, locale: Loc): TranslationRow => ({
  article_id: articleId,
  locale,
  slug: '',
  title: '',
  excerpt: '',
  content: '',
  read_time: ''
});


export default function AdminPage() {
  const supabase = getAdminClient();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<'articles' | 'products' | 'pages' | 'content'>('articles');
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!supabase) {
      setReady(true);
      return;
    }
    supabase.auth.getSession().then(({data}) => {
      setSession(data.session);
      setReady(true);
    });
    const {data: sub} = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  const notify = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(''), 3000);
  }, []);

  if (!supabase) {
    return (
      <Shell>
        <p className="text-sm text-text-dim">
          Supabase غير مربوط — أضف <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> و
          <code className="font-mono"> NEXT_PUBLIC_SUPABASE_ANON_KEY</code> ثم أعد التشغيل.
        </p>
      </Shell>
    );
  }

  if (!ready) return <Shell><p className="text-sm text-text-dim">جارٍ التحميل…</p></Shell>;
  if (!session) return <Login onDone={notify} />;

  return (
    <Shell
      right={
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => supabase.auth.signOut()}
            className="font-mono text-xs text-text-faint hover:text-accent"
          >
            خروج
          </button>
        </div>
      }
    >
      <div className="mb-6 flex gap-2">
        {(
          [
            ['articles', 'المقالات'],
            ['products', 'المنتجات'],
            ['pages', 'الصفحات'],
            ['content', 'نصوص الواجهة']
          ] as const
        ).map(([key, title]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-full px-4 py-1.5 text-sm transition ${
              tab === key ? 'bg-accent font-bold text-bg' : 'text-text-dim hover:text-text'
            }`}
          >
            {title}
          </button>
        ))}
      </div>

      {tab === 'articles' && <Articles notify={notify} />}
      {tab === 'products' && <ProductsTab notify={notify} />}
      {tab === 'pages' && <PagesTab notify={notify} />}
      {tab === 'content' && <SiteContent notify={notify} />}

      {toast && (
        <div className="fixed bottom-6 start-6 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-bg shadow-lg">
          {toast}
        </div>
      )}
    </Shell>
  );
}

function Shell({children, right}: {children: React.ReactNode; right?: React.ReactNode}) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between border-b border-border pb-4">
        <h1 className="text-lg font-extrabold">
          لوحة تحكم <span className="text-accent">steploot</span>
        </h1>
        {right}
      </div>
      {children}
    </div>
  );
}

/* ───────────────────────── login ───────────────────────── */

function Login({onDone}: {onDone: (m: string) => void}) {
  const supabase = getAdminClient()!;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function signIn() {
    setBusy(true);
    setError('');
    const {error} = await supabase.auth.signInWithPassword({email, password});
    setBusy(false);
    if (error) setError('بيانات الدخول غير صحيحة');
    else onDone('أهلًا بك');
  }

  return (
    <Shell>
      <div className="mx-auto max-w-sm">
        <div className="mb-4">
          <label className={label}>البريد الإلكتروني</label>
          <input
            className={input}
            type="email"
            dir="ltr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="mb-5">
          <label className={label}>كلمة المرور</label>
          <input
            className={input}
            type="password"
            dir="ltr"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && signIn()}
          />
        </div>
        {error && <p className="mb-3 text-sm text-red-700">{error}</p>}
        <button
          type="button"
          onClick={signIn}
          disabled={busy || !email || !password}
          className={`${btn} w-full bg-accent text-bg`}
        >
          {busy ? '…' : 'دخول'}
        </button>
        <p className="mt-4 text-xs leading-relaxed text-text-faint">
          الحساب يُنشأ من Supabase → Authentication → Users، ثم يُضاف معرّفه إلى جدول admins.
        </p>
      </div>
    </Shell>
  );
}

/* ───────────────────────── articles ───────────────────────── */

function Articles({notify}: {notify: (m: string) => void}) {
  const supabase = getAdminClient()!;
  const [rows, setRows] = useState<Array<ArticleRow & {title: string | null}>>([]);
  const [editing, setEditing] = useState<string | 'new' | null>(null);

  const load = useCallback(async () => {
    const {data} = await supabase
      .from('articles')
      .select('id, category, tag, featured, status, published_at, cover_image_url, article_translations(locale, title)')
      .order('published_at', {ascending: false, nullsFirst: false});

    setRows(
      ((data ?? []) as Array<ArticleRow & {article_translations: Array<{locale: string; title: string}>}>).map(
        ({article_translations, ...a}) => ({
          ...a,
          title:
            article_translations?.find((t) => t.locale === 'ar')?.title ??
            article_translations?.[0]?.title ??
            null
        })
      )
    );
  }, [supabase]);

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
        + مقال جديد
      </button>

      <div className="divide-y divide-border rounded-xl bg-bg-raised">
        {rows.length === 0 && <p className="p-5 text-sm text-text-dim">لا توجد مقالات بعد.</p>}
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
            <span className="flex-1 truncate text-sm">{row.title ?? '(بلا عنوان)'}</span>
            <span className="font-mono text-[11px] text-text-faint">{row.category}</span>
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
  const [article, setArticle] = useState<ArticleRow>({
    id: '',
    category: 'phones',
    tag: null,
    featured: false,
    status: 'draft',
    published_at: null,
    cover_image_url: null
  });
  const [locale, setLocale] = useState<Loc>('ar');
  const [translations, setTranslations] = useState<Record<Loc, TranslationRow>>(
    Object.fromEntries(LOCALES.map((l) => [l, EMPTY_TRANSLATION('', l)])) as Record<Loc, TranslationRow>
  );
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (id === 'new') return;
    (async () => {
      const {data} = await supabase
        .from('articles')
        .select('*, article_translations(*)')
        .eq('id', id)
        .single();
      if (!data) return;

      const {article_translations, ...rest} = data as ArticleRow & {
        article_translations: TranslationRow[];
      };
      setArticle(rest);
      setTranslations((prev) => {
        const next = {...prev};
        for (const l of LOCALES) {
          const found = article_translations?.find((t) => t.locale === l);
          next[l] = found ?? EMPTY_TRANSLATION(rest.id, l);
        }
        return next;
      });
    })();
  }, [id, supabase]);

  const tr = translations[locale];
  const setTr = (patch: Partial<TranslationRow>) =>
    setTranslations((prev) => ({...prev, [locale]: {...prev[locale], ...patch}}));

  async function save() {
    setBusy(true);
    try {
      const payload = {
        category: article.category,
        tag: article.tag || null,
        featured: article.featured,
        status: article.status,
        published_at:
          article.status === 'published' ? article.published_at ?? new Date().toISOString() : article.published_at,
        cover_image_url: article.cover_image_url || null
      };

      let articleId = article.id;
      if (id === 'new' || !articleId) {
        const {data, error} = await supabase.from('articles').insert(payload).select('id').single();
        if (error) throw error;
        articleId = (data as {id: string}).id;
        setArticle((a) => ({...a, id: articleId}));
      } else {
        const {error} = await supabase.from('articles').update(payload).eq('id', articleId);
        if (error) throw error;
      }

      // A locale is saved when it has a title; a missing slug is generated
      // from that title rather than dropping the translation silently.
      const filled = LOCALES.map((l) => translations[l]).filter((t) => t.title.trim());
      const generated: string[] = [];

      if (filled.length > 0) {
        const rows = filled.map((t) => {
          const slug = t.slug.trim() || slugifyTitle(t.title);
          if (!t.slug.trim()) generated.push(`${t.locale}: ${slug}`);
          return {...t, slug, article_id: articleId, read_time: t.read_time || null};
        });

        const {error} = await supabase
          .from('article_translations')
          .upsert(rows, {onConflict: 'article_id,locale'});
        if (error) throw error;
      }

      if (filled.length === 0) {
        notify('حُفظت الإعدادات — لكن لا توجد ترجمة: اكتب عنوانًا في لغة واحدة على الأقل');
      } else if (article.status === 'draft') {
        notify('تم الحفظ كمسودة — غيّر الحالة إلى "منشور" ليظهر في الموقع');
      } else if (generated.length > 0) {
        notify(`تم النشر ✓ (رابط تلقائي — ${generated.join('، ')})`);
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
    if (id === 'new' || !confirm('حذف هذا المقال وكل ترجماته؟')) return;
    const {error} = await supabase.from('articles').delete().eq('id', article.id);
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
          <label className={label}>التصنيف</label>
          <input
            className={input}
            value={article.category}
            onChange={(e) => setArticle({...article, category: e.target.value})}
          />
        </div>
        <div>
          <label className={label}>الشارة (اختياري)</label>
          <input
            className={input}
            placeholder="BTC"
            value={article.tag ?? ''}
            onChange={(e) => setArticle({...article, tag: e.target.value})}
          />
        </div>
        <div>
          <label className={label}>الحالة</label>
          <select
            className={input}
            value={article.status}
            onChange={(e) => setArticle({...article, status: e.target.value as ArticleRow['status']})}
          >
            <option value="draft">مسودة</option>
            <option value="published">منشور</option>
          </select>
          <p className="mt-1 text-[11px] text-text-faint">
            {article.status === 'draft' ? 'لن يظهر في الموقع' : 'سيظهر في الموقع'}
          </p>
        </div>
        <div className="flex items-end">
          <label className="flex cursor-pointer items-center gap-2 pb-2 text-sm">
            <input
              type="checkbox"
              checked={article.featured}
              onChange={(e) => setArticle({...article, featured: e.target.checked})}
            />
            مميّز في الرئيسية
          </label>
        </div>
        <div className="sm:col-span-3">
          <label className={label}>صورة الغلاف</label>
          <ImageField
            value={article.cover_image_url ?? ''}
            onChange={(url) => setArticle({...article, cover_image_url: url})}
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
                : translations[l].title
                  ? 'text-accent'
                  : 'text-text-faint hover:text-text'
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="grid gap-4 rounded-xl bg-bg-raised p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label}>العنوان</label>
            <input
              className={input}
              value={tr.title}
              onChange={(e) => setTr({title: e.target.value})}
              onBlur={(e) => {
                if (!tr.slug.trim() && e.target.value.trim()) setTr({slug: slugifyTitle(e.target.value)});
              }}
            />
          </div>
          <div>
            <label className={label}>الرابط (slug) — يُملأ تلقائيًا</label>
            <input
              className={`${input} font-mono`}
              dir="ltr"
              value={tr.slug}
              onChange={(e) => setTr({slug: e.target.value})}
            />
          </div>
        </div>
        <div>
          <label className={label}>الملخص</label>
          <textarea
            className={`${input} h-20 resize-y`}
            value={tr.excerpt}
            onChange={(e) => setTr({excerpt: e.target.value})}
          />
        </div>
        <div className="w-40">
          <label className={label}>مدة القراءة</label>
          <input className={input} value={tr.read_time ?? ''} onChange={(e) => setTr({read_time: e.target.value})} />
        </div>
        <div>
          <label className={label}>نص المقال</label>
          <ContentArea value={tr.content} onChange={(content) => setTr({content})} notify={notify} />
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

/* ───────────────────────── site text ───────────────────────── */

type ContentRow = {key: string; locale: string; value: string; note: string | null};

function SiteContent({notify}: {notify: (m: string) => void}) {
  const supabase = getAdminClient()!;
  const [locale, setLocale] = useState<Loc>('ar');
  const [rows, setRows] = useState<ContentRow[]>([]);
  const [filter, setFilter] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const {data} = await supabase
        .from('site_content')
        .select('key, locale, value, note')
        .eq('locale', locale)
        .order('key');
      setRows((data ?? []) as ContentRow[]);
    })();
  }, [locale, supabase]);

  async function saveRow(row: ContentRow) {
    setBusy(true);
    const {error} = await supabase
      .from('site_content')
      .upsert({key: row.key, locale: row.locale, value: row.value}, {onConflict: 'key,locale'});
    setBusy(false);
    notify(error ? `تعذّر الحفظ: ${error.message}` : 'تم الحفظ ✓');
  }

  const shown = rows.filter((r) => r.key.includes(filter) || (r.value ?? '').includes(filter));

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5">
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
        <input
          className={`${input} max-w-xs`}
          placeholder="بحث… (مثال: hero أو privacy)"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      {rows.length === 0 && (
        <p className="rounded-xl bg-bg-raised p-5 text-sm text-text-dim">
          جدول site_content فارغ — شغّل ملف SQL الخاص بنصوص الصفحات أولًا.
        </p>
      )}

      <div className="space-y-3">
        {shown.map((row, i) => {
          const long = row.key.endsWith('.body') || (row.value ?? '').length > 90;
          return (
            <div key={row.key} className="rounded-xl bg-bg-raised p-4">
              <div className="mb-2 flex items-baseline justify-between gap-3">
                <code dir="ltr" className="font-mono text-[11px] text-accent">
                  {row.key}
                </code>
                {row.note && <span className="text-[11px] text-text-faint">{row.note}</span>}
              </div>
              {long ? (
                <textarea
                  className={`${input} h-40 resize-y`}
                  value={row.value ?? ''}
                  onChange={(e) => {
                    const next = [...rows];
                    next[rows.indexOf(shown[i])] = {...row, value: e.target.value};
                    setRows(next);
                  }}
                />
              ) : (
                <input
                  className={input}
                  value={row.value ?? ''}
                  onChange={(e) => {
                    const next = [...rows];
                    next[rows.indexOf(shown[i])] = {...row, value: e.target.value};
                    setRows(next);
                  }}
                />
              )}
              <button
                type="button"
                onClick={() => saveRow(row)}
                disabled={busy}
                className="mt-2 font-mono text-xs text-accent hover:underline"
              >
                حفظ
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

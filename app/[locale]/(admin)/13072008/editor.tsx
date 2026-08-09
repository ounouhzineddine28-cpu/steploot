'use client';

import {useCallback, useRef, useState} from 'react';
import ArticleBody from '@/components/ArticleBody';
import {insertBlock, listImages, prefixLines, uploadImage, wrapSelection} from './lib';

/*
  Shared editing pieces used by the articles, products and pages tabs.
  Keeping them here means every long-text field in the panel gets the same
  toolbar, paste-to-upload behaviour and live preview.
*/

export const input =
  'w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-accent';
export const label = 'mb-1.5 block text-xs font-medium text-text-dim';
export const btn = 'rounded-full px-4 py-2 text-sm font-bold transition disabled:opacity-50';

/*
  Mini version of the homepage card, shown live in the editor so the author
  sees the cover image with the headline underneath before publishing —
  the cover is the first thing a reader judges, and it was previously
  invisible until after saving.
*/
export function CardPreview({
  imageUrl,
  label: kicker,
  title,
  excerpt,
  price
}: {
  imageUrl?: string | null;
  label?: string | null;
  title?: string | null;
  excerpt?: string | null;
  price?: string | null;
}) {
  return (
    <div className="w-full max-w-[19rem] overflow-hidden rounded-xl bg-bg-raised-2">
      {imageUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={imageUrl} alt="" className="aspect-[3/2] w-full object-cover" />
      ) : (
        <div className="grid aspect-[3/2] w-full place-items-center border-b border-border text-center font-mono text-[11px] text-text-faint">
          لا توجد صورة غلاف
        </div>
      )}

      <div className="p-4">
        {kicker && <p className="font-mono text-[10px] text-accent">{kicker}</p>}
        <h4 className="mt-1.5 text-sm font-bold leading-snug">
          {title?.trim() || <span className="text-text-faint">(بلا عنوان)</span>}
        </h4>
        {excerpt?.trim() && (
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-text-dim">{excerpt}</p>
        )}
        {price?.trim() && (
          <p className="mt-2 font-mono text-sm font-semibold text-accent-2">{price}</p>
        )}
      </div>
    </div>
  );
}

/* ───────────── editor: toolbar + preview + image library ───────────── */

type ImgSize = 'normal' | 'wide' | 'full';

const SIZE_LABEL: Record<ImgSize, string> = {
  normal: 'عادية',
  wide: 'عريضة',
  full: 'كاملة'
};

function imageSnippet(url: string, size: ImgSize): string {
  return size === 'normal' ? `![](${url})` : `![|${size}](${url})`;
}

export function ContentArea({
  value,
  onChange,
  notify
}: {
  value: string;
  onChange: (v: string) => void;
  notify: (m: string) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [uploading, setUploading] = useState(false);
  const [size, setSize] = useState<ImgSize>('normal');
  const [preview, setPreview] = useState(false);
  const [library, setLibrary] = useState<Array<{name: string; url: string}> | null>(null);

  /*
    The caret is remembered here rather than read from the DOM at insert time.
    Uploading is async and the upload button steals focus, so by the time an
    image URL arrives the browser's own selection can no longer be trusted —
    that is what used to push every image to the end of the article.
  */
  const selection = useRef({start: 0, end: 0});

  const remember = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    selection.current = {
      start: el.selectionStart ?? 0,
      end: el.selectionEnd ?? el.selectionStart ?? 0
    };
  }, []);

  const restore = useCallback((selStart: number, selEnd: number) => {
    selection.current = {start: selStart, end: selEnd};
    requestAnimationFrame(() => {
      const el = ref.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(selStart, selEnd);
    });
  }, []);

  /** Inserts a block at the remembered caret — never at the end by default. */
  const insert = useCallback(
    (snippet: string) => {
      const {start, end} = selection.current;
      const safeStart = Math.min(start, value.length);
      const safeEnd = Math.min(Math.max(end, safeStart), value.length);

      const {value: next, caret} = insertBlock(value, safeStart, safeEnd, snippet);
      onChange(next);
      restore(caret, caret);
    },
    [onChange, restore, value]
  );

  const handleFiles = useCallback(
    async (files: File[], mode: 'separate' | 'gallery' = 'separate') => {
      const images = files.filter((f) => f.type.startsWith('image/'));
      if (images.length === 0) return;

      setUploading(true);
      try {
        const urls: string[] = [];
        for (const file of images) urls.push(await uploadImage(file));

        // Built as one snippet and inserted once: inserting in a loop would read
        // a stale value between renders and scramble the order.
        const snippet = urls
          .map((url) => imageSnippet(url, size))
          .join(mode === 'gallery' ? '\n' : '\n\n');

        insert(snippet);
        notify(urls.length > 1 ? `تم إدراج ${urls.length} صور ✓` : 'تم إدراج الصورة ✓');
      } catch (e) {
        notify(`تعذّر الرفع: ${(e as Error).message}`);
      } finally {
        setUploading(false);
      }
    },
    [insert, notify, size]
  );

  const apply = (
    fn: (
      value: string,
      start: number,
      end: number
    ) => {value: string; selStart: number; selEnd: number}
  ) => () => {
    const {start, end} = selection.current;
    const safeStart = Math.min(start, value.length);
    const safeEnd = Math.min(Math.max(end, safeStart), value.length);

    const {value: next, selStart, selEnd} = fn(value, safeStart, safeEnd);
    onChange(next);
    restore(selStart, selEnd);
  };

  const BUTTONS: Array<{label: string; title: string; onClick: () => void}> = [
    {
      label: 'عنوان',
      title: 'عنوان رئيسي داخل المقال',
      onClick: apply((v, a, b) => prefixLines(v, a, b, '## ', 'عنوان'))
    },
    {
      label: 'عنوان صغير',
      title: 'عنوان فرعي',
      onClick: apply((v, a, b) => prefixLines(v, a, b, '### ', 'عنوان فرعي'))
    },
    {
      label: 'عريض',
      title: 'نص عريض',
      onClick: apply((v, a, b) => wrapSelection(v, a, b, '**', '**', 'نص'))
    },
    {
      label: 'قائمة',
      title: 'قائمة نقطية',
      onClick: apply((v, a, b) => prefixLines(v, a, b, '- ', 'عنصر'))
    },
    {
      label: 'اقتباس',
      title: 'اقتباس',
      onClick: apply((v, a, b) => prefixLines(v, a, b, '> ', 'اقتباس'))
    },
    {
      label: 'رابط',
      title: 'رابط',
      onClick: apply((v, a, b) => wrapSelection(v, a, b, '[', '](https://)', 'نص الرابط'))
    },
    {
      label: 'رابط شراء',
      title: 'رابط أفلييت — يُضاف له rel="nofollow sponsored" تلقائيًا',
      onClick: apply((v, a, b) => wrapSelection(v, a, b, '[', '](aff:https://)', 'اسم المنتج'))
    },
    {
      label: 'كود',
      title: 'كود Red Packet هادئ داخل الجملة',
      onClick: apply((v, a, b) => wrapSelection(v, a, b, '((', '))', 'TMWEEK26'))
    },
    {label: 'فاصل', title: 'خط فاصل', onClick: () => insert('---')}
  ];

  async function openLibrary() {
    if (library) {
      setLibrary(null);
      return;
    }
    setLibrary([]);
    setLibrary(await listImages());
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-1.5 rounded-lg bg-bg-raised-2 p-2">
        {BUTTONS.map((b) => (
          <button
            key={b.label}
            type="button"
            title={b.title}
            onClick={b.onClick}
            className="rounded-md px-2.5 py-1.5 text-xs text-text-dim transition hover:bg-bg hover:text-text"
          >
            {b.label}
          </button>
        ))}

        <span className="mx-1 h-5 w-px bg-border" />

        <label className="cursor-pointer rounded-md px-2.5 py-1.5 text-xs font-medium text-accent transition hover:bg-bg">
          + صورة
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              handleFiles(Array.from(e.target.files ?? []));
              e.target.value = '';
            }}
          />
        </label>

        <label className="cursor-pointer rounded-md px-2.5 py-1.5 text-xs font-medium text-accent transition hover:bg-bg">
          + شبكة صور
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              handleFiles(Array.from(e.target.files ?? []), 'gallery');
              e.target.value = '';
            }}
          />
        </label>

        <select
          value={size}
          onChange={(e) => setSize(e.target.value as ImgSize)}
          title="حجم الصورة المُدرَجة"
          className="rounded-md border border-border bg-bg px-2 py-1 text-xs text-text-dim"
        >
          {(Object.keys(SIZE_LABEL) as ImgSize[]).map((s) => (
            <option key={s} value={s}>
              {SIZE_LABEL[s]}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={openLibrary}
          className="rounded-md px-2.5 py-1.5 text-xs text-text-dim transition hover:bg-bg hover:text-text"
        >
          مكتبة الصور
        </button>

        <button
          type="button"
          onClick={() => setPreview((v) => !v)}
          className={`ms-auto rounded-md px-2.5 py-1.5 text-xs transition ${
            preview ? 'bg-accent font-bold text-bg' : 'text-text-dim hover:bg-bg hover:text-text'
          }`}
        >
          معاينة
        </button>
      </div>

      {library && (
        <div className="mb-2 rounded-lg border border-border p-3">
          {library.length === 0 ? (
            <p className="text-xs text-text-faint">لا توجد صور مرفوعة بعد.</p>
          ) : (
            <div className="grid max-h-56 grid-cols-4 gap-2 overflow-y-auto sm:grid-cols-6">
              {library.map((img) => (
                <button
                  key={img.url}
                  type="button"
                  title={`إدراج ${img.name}`}
                  onClick={() => insert(imageSnippet(img.url, size))}
                  className="overflow-hidden rounded-md border border-border transition hover:border-accent"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt="" className="aspect-square w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className={preview ? 'grid gap-3 lg:grid-cols-2' : ''}>
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            remember();
          }}
          onSelect={remember}
          onClick={remember}
          onKeyUp={remember}
          onBlur={remember}
          onPaste={(e) => {
            const files = Array.from(e.clipboardData.files);
            if (files.length > 0) {
              e.preventDefault();
              remember();
              handleFiles(files);
            }
          }}
          onDrop={(e) => {
            const files = Array.from(e.dataTransfer.files);
            if (files.length > 0) {
              e.preventDefault();
              handleFiles(files);
            }
          }}
          className={`${input} h-96 resize-y font-mono text-[13px] leading-7`}
          placeholder={'اكتب المقال هنا…\n\nضع المؤشر في المكان الذي تريده ثم اضغط "+ صورة" — تُدرج هناك لا في آخر المقال.'}
        />

        {preview && (
          <div className="h-96 overflow-y-auto rounded-lg border border-border bg-paper p-5">
            {value.trim() ? (
              <ArticleBody content={value} />
            ) : (
              <p className="text-sm text-text-faint">المعاينة تظهر هنا.</p>
            )}
          </div>
        )}
      </div>

      <p className="mt-2 font-mono text-[11px] text-text-faint">
        {uploading ? 'جارٍ الرفع…' : 'كل إدراج يحدث في مكان المؤشر — انقر داخل النص أولًا لتحديد الموضع'}
      </p>
    </div>
  );
}

export function ImageField({value, onChange}: {value: string; onChange: (url: string) => void}) {
  const [busy, setBusy] = useState(false);

  return (
    <div className="flex items-center gap-3">
      <input
        className={`${input} font-mono text-xs`}
        dir="ltr"
        value={value}
        placeholder="https://…"
        onChange={(e) => onChange(e.target.value)}
      />
      <label className="shrink-0 cursor-pointer whitespace-nowrap font-mono text-xs text-accent hover:underline">
        {busy ? '…' : 'رفع'}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (!file) return;
            setBusy(true);
            try {
              onChange(await uploadImage(file));
            } finally {
              setBusy(false);
            }
          }}
        />
      </label>
    </div>
  );
}


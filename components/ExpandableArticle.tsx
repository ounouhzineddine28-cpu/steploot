'use client';

import {useEffect, useRef, useState} from 'react';
import {useTranslations} from 'next-intl';

/*
  Progressive reveal for long articles: the body is clamped to a few lines and
  each press of the button reveals 20 more.

  Two details worth keeping:
  - The clamp is a CSS max-height in `lh` units, so "20 lines" means real text
    lines at the current font size, not a guess at paragraph counts.
  - The full text is always in the DOM (only visually clipped), so Google reads
    the whole article — this is a reading affordance, not hidden content. The
    <noscript> rule below removes the clamp entirely when JS is unavailable, so
    the article is never unreadable.
*/
export default function ExpandableArticle({
  children,
  initialLines = 14,
  step = 20
}: {
  children: React.ReactNode;
  initialLines?: number;
  step?: number;
}) {
  const t = useTranslations('article');
  const ref = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<number | null>(initialLines);
  const [clipped, setClipped] = useState(true);

  // Images and fonts settle after mount, so re-measure instead of measuring once.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () => setClipped(el.scrollHeight > el.clientHeight + 4);
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [lines]);

  const showButton = lines !== null && clipped;

  return (
    <div>
      <noscript>
        {/* eslint-disable-next-line react/no-danger */}
        <style dangerouslySetInnerHTML={{__html: '.article-clamp{max-height:none!important}'}} />
      </noscript>

      <div
        ref={ref}
        className="article-clamp relative overflow-hidden"
        style={lines === null ? undefined : {maxHeight: `${lines}lh`}}
      >
        {children}

        {showButton && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-paper to-transparent"
          />
        )}
      </div>

      {showButton && (
        <button
          type="button"
          aria-expanded={false}
          onClick={() => setLines((current) => (current ?? initialLines) + step)}
          className="mt-5 rounded-full border border-border px-5 py-2 font-mono text-xs text-text-dim transition-colors hover:border-accent/60 hover:text-accent"
        >
          {t('readMore')}
        </button>
      )}
    </div>
  );
}

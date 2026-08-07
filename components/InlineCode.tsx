'use client';

import {useState} from 'react';
import {useTranslations} from 'next-intl';

/*
  In-article promo codes (see AGENTS.md).
  Written by hand inside the article text as ((CODE)) — rendered as part of
  the sentence: mono, warm gold, a dotted underline, click to copy. No card,
  no badge, no ticket. The code stays real text in the DOM so Google indexes
  it and nothing reads as cloaking.
*/
export default function InlineCode({code}: {code: string}) {
  const t = useTranslations('codes');
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (http / older browser) — the code is still readable.
    }
  }

  return (
    <span className="whitespace-nowrap">
      <button
        type="button"
        onClick={copy}
        dir="ltr"
        title={t('copy')}
        className="cursor-pointer font-mono text-[0.94em] font-medium text-accent-2 underline decoration-accent-2/45 decoration-dotted underline-offset-4 transition-colors hover:text-text hover:decoration-text/40"
      >
        {code}
      </button>
      {copied && (
        <span className="ms-1.5 font-mono text-[0.72em] text-accent">{t('copied')}</span>
      )}
    </span>
  );
}

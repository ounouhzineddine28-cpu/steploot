'use client';

import {useState} from 'react';
import {useTranslations} from 'next-intl';
import Icon from './Icon';

type Props = {
  code: string;
  label: string;
  note?: string;
  expired?: boolean;
};

/*
  Signature element (see AGENTS.md): promo codes are styled as dashed-edge
  "tickets" with side punch holes — reuse this everywhere codes are shown
  (in-article embeds, the /codes archive), just never on the homepage.
  The code stays as real text in the DOM (indexable — no images/cloaking).
*/
export default function CodeTicket({code, label, note, expired = false}: Props) {
  const t = useTranslations('codes');
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (http / old browser) — silently ignore.
    }
  }

  const edge = expired ? 'border-border' : 'border-accent-2/45';

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border-2 border-dashed bg-bg-raised p-6 ${edge} ${
        expired ? 'opacity-60' : ''
      }`}
    >
      {/* Ticket punch holes */}
      <span
        className={`absolute -start-3.5 top-1/2 size-7 -translate-y-1/2 rounded-full border-2 border-dashed bg-bg ${edge}`}
      />
      <span
        className={`absolute -end-3.5 top-1/2 size-7 -translate-y-1/2 rounded-full border-2 border-dashed bg-bg ${edge}`}
      />

      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-xs text-accent-2">{label}</p>
        <span
          className={`rounded-full px-2.5 py-0.5 font-mono text-[11px] ${
            expired ? 'bg-bg-raised-2 text-text-faint' : 'bg-accent/10 text-accent'
          }`}
        >
          {expired ? t('expired') : t('active')}
        </span>
      </div>

      <p
        className={`mt-3 font-mono text-2xl font-semibold tracking-[0.2em] ${
          expired ? 'text-text-faint line-through' : ''
        }`}
        dir="ltr"
      >
        {code}
      </p>

      {note && <p className="mt-2 text-sm text-text-dim">{note}</p>}

      {!expired && (
        <button
          type="button"
          onClick={copy}
          className="mt-4 flex items-center gap-2 rounded-full border border-accent-2/40 px-4 py-2 font-mono text-xs text-accent-2 transition-colors hover:bg-accent-2/10"
        >
          <Icon name={copied ? 'check' : 'copy'} className="size-3.5" />
          {copied ? t('copied') : t('copy')}
        </button>
      )}
    </div>
  );
}

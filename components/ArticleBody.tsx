import type {ReactNode} from 'react';
import {parseArticleContent, type ArticleImage} from '@/lib/article-content';
import InlineCode from './InlineCode';

/*
  Renders parsed article blocks with a deliberately quiet, minimal treatment:
  one measure (~68ch), generous leading, hairline rules, no boxes.
  Images are the only element allowed to break the measure.
*/

const INLINE = /(\(\([^()\s]+\)\)|\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)\s]+\))/g;

// **bold** · `code` · [text](url) · ((PROMOCODE))
function inline(text: string): ReactNode[] {
  return text.split(INLINE).map((token, index) => {
    if (token.startsWith('((') && token.endsWith('))')) {
      return <InlineCode key={index} code={token.slice(2, -2)} />;
    }
    if (token.startsWith('**') && token.endsWith('**')) {
      return <strong key={index} className="font-bold">{token.slice(2, -2)}</strong>;
    }
    if (token.startsWith('`') && token.endsWith('`')) {
      return (
        <code key={index} className="rounded bg-bg-raised px-1.5 py-0.5 font-mono text-[0.82em] text-accent">
          {token.slice(1, -1)}
        </code>
      );
    }
    const link = token.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
    if (link) {
      // `aff:` marks a paid/affiliate link. Google requires rel="sponsored"
      // on those, and getting it wrong risks a manual action — so the marker
      // sets it here rather than trusting every link to be tagged by hand.
      const isAffiliate = link[2].startsWith('aff:');
      const href = isAffiliate ? link[2].slice(4) : link[2];
      const external = href.startsWith('http');

      return (
        <a
          key={index}
          href={href}
          className="text-accent underline decoration-accent/40 underline-offset-4 hover:decoration-accent"
          target={external ? '_blank' : undefined}
          rel={
            isAffiliate
              ? 'nofollow sponsored noopener noreferrer'
              : external
                ? 'noopener noreferrer'
                : undefined
          }
        >
          {link[1]}
        </a>
      );
    }
    return token;
  });
}

const BREAKOUT: Record<ArticleImage['size'], string> = {
  normal: '',
  wide: 'lg:-mx-12',
  full: 'lg:-mx-24 xl:-mx-40'
};

function Figure({images}: {images: ArticleImage[]}) {
  const size = images[0].size;
  const isGallery = images.length > 1;
  const captions = images.map((image) => image.caption).filter(Boolean);

  return (
    <figure className={`my-10 ${BREAKOUT[size]}`}>
      <div className={isGallery ? 'grid gap-3 sm:grid-cols-2' : ''}>
        {images.map((image) => (
          /* Plain <img> keeps this working with any Supabase Storage URL with
             zero next.config setup. Swap for next/image later if you add
             remotePatterns for your project's storage hostname. */
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={image.src}
            src={image.src}
            alt={image.caption}
            loading="lazy"
            decoding="async"
            className="w-full rounded-lg border border-border bg-bg-raised object-cover"
          />
        ))}
      </div>
      {captions.length > 0 && (
        <figcaption className="mt-3 text-center font-mono text-[11px] leading-relaxed text-text-faint">
          {captions.join(' · ')}
        </figcaption>
      )}
    </figure>
  );
}

export default function ArticleBody({
  content,
  variant = 'article'
}: {
  content: string;
  /** 'article' = serif reading page · 'page' = regular site pages (about, policies) */
  variant?: 'article' | 'page';
}) {
  const blocks = parseArticleContent(content);

  return (
    <div
      className={
        variant === 'article'
          ? 'font-serif text-[19px] leading-[2.05] text-text md:text-[20px]'
          : 'text-base leading-[1.9] text-text-dim'
      }
    >
      {blocks.map((block, index) => {
        switch (block.kind) {
          case 'heading':
            return block.level === 2 ? (
              <h2 key={index} className="mt-14 mb-4 font-sans text-xl font-extrabold leading-snug md:text-2xl">
                {block.text}
              </h2>
            ) : (
              <h3 key={index} className="mt-10 mb-3 font-sans text-base font-bold leading-snug md:text-lg">
                {block.text}
              </h3>
            );

          case 'quote':
            return (
              <blockquote
                key={index}
                className="my-10 border-s-2 border-accent/50 ps-6 text-[1.05em] leading-relaxed text-text-dim"
              >
                {inline(block.text)}
              </blockquote>
            );

          case 'list':
            return (
              <ul key={index} className="my-6 space-y-2.5 ps-5">
                {block.items.map((item, i) => (
                  <li key={i} className="marker:text-accent list-disc">
                    {inline(item)}
                  </li>
                ))}
              </ul>
            );

          case 'divider':
            return <hr key={index} className="my-12 border-border" />;

          case 'images':
            return <Figure key={index} images={block.images} />;

          default:
            return (
              <p key={index} className="my-6">
                {inline(block.text)}
              </p>
            );
        }
      })}
    </div>
  );
}

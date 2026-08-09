/*
  Article content format
  ----------------------
  The `content` column in Supabase is plain text. Blocks are separated by a
  BLANK LINE. Each block is one of:

    نص عادي                      → فقرة
    ## عنوان فرعي                → عنوان (h2)
    ### عنوان أصغر               → عنوان (h3)
    > اقتباس                     → اقتباس
    - عنصر أول                   → قائمة (كل سطر يبدأ بـ - )
    - عنصر ثاني
    ---                          → فاصل
    ![وصف الصورة](رابط الصورة)    → صورة

  الصور:
    - ضع سطر الصورة في أي مكان بين الفقرات، وبأي عدد.
    - النص داخل [ ] هو التعليق أسفل الصورة (ويُستخدم كـ alt للـ SEO).
    - حجم الصورة اختياري بعد | :
        ![وصف|wide](url)   أعرض قليلًا من النص
        ![وصف|full](url)   بعرض الصفحة كاملًا
    - سطران أو أكثر من الصور متتالية (بدون سطر فارغ بينها) تُعرض كشبكة معًا.

  Inline داخل الفقرات:
    **عريض** · `كود برمجي` · [نص الرابط](https://...)
    ((TMWEEK26))  → كود Red Packet هادئ داخل الجملة (قابل للنسخ بضغطة)
    [اسم المنتج](aff:https://amzn.to/xxx)
                  → رابط شراء/أفلييت — يفتح في تبويب جديد ويُضاف له
                    rel="nofollow sponsored" تلقائيًا كما تشترط جوجل.
*/

export type ImageSize = 'normal' | 'wide' | 'full';

export type ArticleImage = {
  src: string;
  caption: string;
  size: ImageSize;
};

export type Block =
  | {kind: 'paragraph'; text: string}
  | {kind: 'heading'; level: 2 | 3; text: string}
  | {kind: 'quote'; text: string}
  | {kind: 'list'; items: string[]}
  | {kind: 'divider'}
  | {kind: 'images'; images: ArticleImage[]};

const IMAGE_LINE = /^!\[([^\]]*)\]\(([^)\s]+)\)$/;

function parseImageLine(line: string): ArticleImage | null {
  const match = line.trim().match(IMAGE_LINE);
  if (!match) return null;

  const [, rawCaption, src] = match;
  const pipe = rawCaption.lastIndexOf('|');
  let caption = rawCaption;
  let size: ImageSize = 'normal';

  if (pipe !== -1) {
    const suffix = rawCaption.slice(pipe + 1).trim().toLowerCase();
    if (suffix === 'wide' || suffix === 'full') {
      size = suffix;
      caption = rawCaption.slice(0, pipe);
    }
  }

  return {src, caption: caption.trim(), size};
}

export function parseArticleContent(content: string): Block[] {
  return content
    .split(/\n{2,}/)
    .map((raw) => raw.trim())
    .filter(Boolean)
    .map((raw): Block => {
      const lines = raw.split('\n').map((line) => line.trim()).filter(Boolean);

      // صور — سطر واحد أو عدة أسطر متتالية (شبكة)
      const images = lines.map(parseImageLine);
      if (images.length > 0 && images.every((image) => image !== null)) {
        return {kind: 'images', images: images as ArticleImage[]};
      }

      if (/^-{3,}$/.test(raw)) return {kind: 'divider'};

      if (raw.startsWith('### ')) {
        return {kind: 'heading', level: 3, text: raw.slice(4).trim()};
      }
      if (raw.startsWith('## ')) {
        return {kind: 'heading', level: 2, text: raw.slice(3).trim()};
      }

      if (lines.every((line) => line.startsWith('> '))) {
        return {kind: 'quote', text: lines.map((line) => line.slice(2)).join(' ')};
      }

      if (lines.every((line) => /^[-*]\s+/.test(line))) {
        return {kind: 'list', items: lines.map((line) => line.replace(/^[-*]\s+/, ''))};
      }

      return {kind: 'paragraph', text: lines.join(' ')};
    });
}

/**
 * First image URL found in an article body.
 * Used as an automatic cover when `cover_image_url` is empty, so a card is
 * never text-only just because the author forgot to set the cover.
 */
export function firstImageFromContent(content: string): string | null {
  for (const line of content.split('\n')) {
    const image = parseImageLine(line);
    if (image) return image.src;
  }
  return null;
}

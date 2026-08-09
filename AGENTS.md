# AGENTS.md — steploot

Guidance for any AI agent (Claude Code or similar) working on this repo.
Read this before making changes.

## What this project is

steploot is a tech-news website with four revenue streams:
1. Display ads (AdSense + Web3 CPM networks)
2. Binance Red Packet promo codes hidden inside articles (drives traffic + read time)
3. Affiliate marketing (Amazon Associates and similar)
4. A Telegram channel used for distribution, contests, and exclusive codes

The homepage has these sections, in order: Header, Hero, Trending News,
Extras & Crypto News (third section — also holds the Telegram channel link
and links to join other platforms), Footer.

Products and Promo Codes are **not** homepage sections:
- Products live on their own dedicated page (`/[locale]/products`), not on
  the homepage.
- Promo codes are not shown as a standalone homepage block — they are
  distributed *inside* article content (see "Content & compliance rules"
  below for placement). The `/codes` archive page can still exist for
  browsing past codes, but nothing code-related belongs on the homepage
  itself, and the homepage does not link to `/codes`.

## Tech stack

- Next.js 15, App Router
- TypeScript (strict mode — do not introduce `any` without a comment explaining why)
- Tailwind CSS **v4** — there is no `tailwind.config` file; all design
  tokens are defined with `@theme` in `app/globals.css`
- next-intl (v4) for i18n
- Content source: **Supabase** (Postgres). Two tables — `articles` (shared
  fields) and `article_translations` (one row per locale per article) —
  read through the `published_articles` view. Schema lives in
  `supabase/schema.sql`; run it once in the Supabase SQL editor on a fresh
  project. Content is currently managed by hand from the Supabase Table
  Editor (no admin UI in the app yet).

## Languages

Four locales, always: `ar` (default, RTL), `en`, `fr`, `es`.

- Every user-facing string goes in `messages/<locale>.json` — never hardcode
  copy inside a component.
- All four JSON files must stay in sync: same keys, same nesting. If you add
  a key to `en.json`, add it to the other three in the same change, even as
  a placeholder translation to fix later.
- `ar` is the only RTL locale. Don't assume RTL when writing layout CSS —
  use logical properties (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-` in
  Tailwind) instead of `ml-`/`mr-` where direction matters. Icons that imply
  direction get `rtl:-scale-x-100`.
- Never apply `tracking-*` (letter-spacing) to text that can be Arabic — it
  breaks letter joining. The `.kicker` helper class in `globals.css` handles
  this (spacing in LTR, none in RTL); use it for small uppercase mono labels.
- When adding a new page or component, wire it through `useTranslations()`
  from `next-intl` (works in Client Components and non-async Server
  Components); use `getTranslations()` from `next-intl/server` in async
  Server Components/pages.

## Design system

Direction: **warm minimal** — off-white paper, beige surfaces, hairline rules,
generous whitespace, no decorative grids/glows/gradients. One accent for
anything interactive, one accent for codes and prices, nothing else.
Tokens are defined under `@theme` in `app/globals.css`; each generates its
utilities (`bg-bg-raised`, `text-text-dim`, `border-border`, `text-accent`,
`text-accent-2`, `bg-paper`).

| Token | Hex | Use |
|---|---|---|
| `bg` | #FDFBF6 | page background (warm off-white) |
| `bg-raised` | #F5F0E6 | cards (beige) |
| `bg-raised-2` | #ECE5D7 | elevated panels |
| `paper` | #FFFFFF | reading surface — article pages only |
| `border` | #E3DAC9 | hairlines (also the global default border color) |
| `text` | #1E1B16 | primary text (warm near-black) |
| `text-dim` | #6B6355 | secondary text |
| `text-faint` | #9A9284 | metadata, timestamps |
| `accent` | #2C5A4A | links, buttons, active states |
| `accent-2` | #B4741A | codes and prices — nothing else |

Text on an `accent` background uses `text-bg` (the cream), never white.

Fonts: Tajawal (UI), **Amiri** (article reading — serif, used only inside
the reader route group), JetBrains Mono (codes, metadata, numbers). Loaded
via a Google Fonts `<link>` in `app/[locale]/layout.tsx`.

Buttons are pill-shaped (`rounded-full`); cards are `rounded-xl` beige
surfaces with no border. Prefer a hairline rule or a change of surface over
adding a box.

## Dark mode

One switch, no `dark:` classes in components. `.dark` on `<html>` redefines
the same `--color-*` tokens with darker (still warm) values in
`app/globals.css`, so every existing utility flips automatically — including
the admin panel. The dark block is deliberately **unlayered** so it always
wins over the `@theme` defaults.

- `@custom-variant dark (&:where(.dark, .dark *))` enables class-based `dark:`
  for the rare case where a component genuinely needs it (currently only the
  sun/moon icon swap in `ThemeToggle`).
- An inline script in `app/[locale]/layout.tsx` applies the saved choice (or
  the OS preference) before first paint; `<html>` carries
  `suppressHydrationWarning` because of it.
- `ThemeToggle` swaps icons with `dark:` rather than React state, so server
  and client markup match.
- It lives **inside `LocaleSwitcher`** (same pill, after a hairline divider),
  so every surface that shows the language control gets the theme switch for
  free — don't add a second one to the header. The two places that have no
  language control render it standalone: the reader chrome and the admin
  panel header.

When adding a color, add it as a token in `@theme` **and** in the `.dark`
block. Never hardcode a hex in a component — it won't flip.

## Two chromes (route groups)

The article page is meant to feel like a **separate publication**, not another
page of the site. This is enforced by route groups — the root
`app/[locale]/layout.tsx` holds only `<html>`/`<body>`/providers, and chrome
lives one level down:

- `app/[locale]/(site)/` — Header + Footer. Homepage, products, codes, policies.
- `app/[locale]/(reader)/` — quiet reader bar on `bg-paper`: wordmark, a back
  link, a one-line footer. No navigation, no language switcher, serif body type.

Route groups don't affect URLs. When adding a page, decide which chrome it
belongs to and put it in that group. Don't reintroduce Header/Footer into the
reader group.

(The reader deliberately has no LocaleSwitcher: slugs differ per locale, so
switching locale on an article URL would 404 until translated slugs are
linked by article id — see tasks.md.)

Both group layouts must call `setRequestLocale(locale)` from their own
`params` before any `getTranslations()`. Layouts render before pages, so
relying on the page to pin the locale makes next-intl read request headers,
which turns the route dynamic and converts a missing article into a 500.
`app/[locale]/not-found.tsx` is the 404 boundary and stays free of next-intl
hooks for the same reason.

## Content & compliance rules

- Article content must be rewritten in our own words (AI-assisted rewrite is
  fine) — never a near-verbatim translation or copy of a source article.
  This is a hard requirement: copied content risks AdSense rejection/ban
  and Google SEO penalties, not just a style preference.
- No more than 3 visible ad units per mobile screen, and never two ads
  adjacent with no content between them (AdSense policy).
- Promo codes inside articles are written by hand in the article text as
  `((CODE))` and render **quietly, inline in the sentence** — mono, gold,
  dotted underline, click-to-copy (`components/InlineCode.tsx`). Never a
  ticket/card/banner inside article body copy. The dashed-ticket treatment
  (`components/CodeTicket.tsx`) is reserved for the standalone `/codes`
  archive page.
- Codes must remain as real text in the DOM (indexable), not images or
  JS-injected-only content — avoid anything that could read as cloaking.
- Every article needs: title, category, hidden code placement (1 near top,
  2–3 mid-article, 1 at the end), and — for review/comparison articles —
  an affiliate product block.

## Content data (Supabase)

- `lib/supabase.ts` builds the client from `NEXT_PUBLIC_SUPABASE_URL` /
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`. If either is missing, it returns `null`
  — this is intentional, not an error state.
- `lib/articles.ts` is the only place components fetch article data from.
  Supabase is the **only** content source — there is no placeholder dataset
  any more. No articles means an empty section (`trending.empty`,
  `extras.cryptoEmpty`) and a missing slug means a real 404. Do not
  reintroduce demo/sample data as a fallback: it is indistinguishable from
  real content in the UI, links nowhere, and makes a working connection look
  broken.
- Never query `articles` / `article_translations` directly from a
  component — always go through `published_articles` (a view that already
  filters to `status = 'published'` and flattens the per-locale row), so
  drafts can never leak to the public site.
- To go from zero to a working connection: run `supabase/schema.sql` in a
  Supabase project's SQL editor, optionally run `supabase/seed.sql` for one
  test article, then set the two env vars in `.env.local` (see
  `.env.local.example`) — nothing else in the code needs to change.

## Editable content (Supabase)

Two layers, both editable without a redeploy:

1. **Articles** — `articles` + `article_translations`, read via `published_articles`.
1. **Products** — `products` + `product_translations`, read via
   `published_products` (`lib/products.ts`). Same shape as articles: shared
   fields plus one row per locale, draft/published, ordered by `sort_order`.
2. **Every other string on the site** — `site_content` (key, locale, value).
   `messages/<locale>.json` stays in the repo as the DEFAULT copy and offline
   fallback; `i18n/request.ts` merges Supabase overrides on top by dotted key
   (`hero.titleA`, `privacy.body`, …) via `lib/site-content.ts`. An empty
   value means "fall back to the JSON default", not "render nothing".

So: never tell the user to edit `messages/*.json` for a copy change — add or
edit the matching row in `site_content` instead. Only add NEW keys to the JSON
files (all four, in sync), then seed them into `site_content`.

Page bodies (`about.body`, `privacy.body`, `terms.body`) are rendered through
`ArticleBody variant="page"`, so they accept the same block syntax as articles
(headings, images, lists, quotes).

Both route-group layouts set `revalidate = 600`, so edits appear within ~10
minutes. Consider an on-demand revalidation webhook if that ever needs to be
instant.

## Affiliate links

Any paid or commission link inside article copy is written `[text](aff:URL)`.
`ArticleBody` strips the `aff:` marker and renders the link with
`rel="nofollow sponsored noopener noreferrer"` and `target="_blank"`. Google
requires `sponsored` on affiliate links and a manual action is the penalty for
missing it — so never hand-write a plain `[text](url)` for a paid link, and
never remove the marker handling. The products page applies the same rel on
its CTA.

## Reading experience

Article bodies are wrapped in `ExpandableArticle`: clamped to ~14 lines, with a
button revealing 20 more per press. The clamp is a CSS `max-height` in `lh`
units and the full text always stays in the DOM — visually clipped, never
conditionally rendered — so crawlers read the whole article and a `<noscript>`
rule drops the clamp when JS is off. Don't reimplement this by slicing content
server-side; that would hide text from search engines.

## Slugs

Slugs may be Arabic (the admin generates them from the title and keeps Arabic
letters). Non-ASCII slugs travel percent-encoded through the URL and can reach
the page still encoded, so `getArticleBySlug` matches against both spellings
via `slugVariants`. Never compare a raw `params.slug` to a stored slug with a
plain equality check.

## Runtime settings

`lib/settings.ts` is the single place that reads live settings from Supabase:

- `getAppConfig()` → the `app_config` key/value table. Used for
  `telegram_url` and `crypto_category`.
- `getPlatforms()` → the `platforms` table (key, label, url, sort_order,
  enabled). Rows with an empty URL or `enabled = false` are dropped, so a
  half-configured platform never renders as a dead button.

Both fall back to the constants in `lib/site.ts`. Server components fetch
these; `Header` and `Footer` are client/presentational and receive
`telegramUrl` / `platforms` as props from `(site)/layout.tsx` — don't import
the constants directly in a component again.

The crypto list in `ExtrasCryptoNews` is not static data: it's
`getArticlesByCategory(locale, crypto_category, 4)`, and each row links to
its article. `articles.tag` provides the short badge (BTC, ETH…), falling
back to `category`.

## Admin panel

`/[locale]/13072008` (route group `(admin)`) — client-side, `noindex`, no site
chrome. The unguessable path is obscurity only: the real boundary is Supabase
Auth plus the `admins` table checked by `is_admin()` in every RLS policy, so a
leaked URL grants nothing. Renaming the folder is all it takes to change the
path — nothing links to it. Supabase Auth email/password; write access is gated by the `admins`
table through the `is_admin()` SQL function, not by "any authenticated user".

Four tabs, all managing **all four locales** (the panel's own UI is Arabic):
`المقالات` (articles) · `المنتجات` (products) · `الصفحات` (about/privacy/terms
long-form bodies) · `نصوص الواجهة` (every other string in `site_content`).

Files: `page.tsx` (shell, auth, articles, site strings) · `products.tsx` ·
`pages.tsx` · `editor.tsx` (shared `ContentArea`, `ImageField` and the input
class constants) · `lib.ts` (client, uploads, text helpers).
Any new long-text field should use `ContentArea` so it inherits the toolbar,
paste-to-upload and live preview instead of growing a second editor.

- Article editor with per-locale tabs, publish toggle, cover image.
- Editor toolbar writes the block syntax for the user (heading, bold, list,
  quote, link, inline code, divider) via `wrapSelection` / `prefixLines` in
  `13072008/lib.ts` — buttons produce plain text, they don't switch the format.
- Images: paste, drag-drop, multi-file upload, a "gallery" mode that inserts
  consecutive image lines (rendered side by side), a size selector
  (normal/wide/full), and an image library listing the `media` bucket.
- **Insertion position**: the editor keeps the caret in a ref (`selection`)
  updated on select/click/keyup/blur, and every helper in `13072008/lib.ts` is a
  pure `(value, start, end, …)` function. Never read `el.selectionStart` at
  insert time — uploads are async and the upload button steals focus, which is
  what made images pile up at the end of the article. Multi-file uploads build
  one snippet and insert once; inserting in a loop reads a stale value between
  renders.
- Live preview renders the real `ArticleBody`, so what the editor shows is
  exactly what the article page renders.
- Site text tab edits `site_content` rows directly.

Keep the panel dependency-free — no WYSIWYG library. The stored format stays
plain text on purpose (diffable, CMS-portable, no HTML sanitizing); the
toolbar is a typing aid over that text, never a replacement for it.

## Article content format

`article_translations.content` is plain text parsed by `lib/article-content.ts`
and rendered by `components/ArticleBody.tsx`. Blocks are separated by a blank
line:

| Syntax | Renders as |
|---|---|
| plain text | paragraph (supports `**bold**`, `` `code` ``, `[text](url)`) |
| `## text` / `### text` | h2 / h3 |
| `> text` | pull quote |
| `- item` lines | bulleted list |
| `---` | hairline divider |
| `![caption](url)` | figure with caption (caption doubles as `alt`) |
| `![caption\|wide](url)` | figure breaking slightly out of the measure |
| `![caption\|full](url)` | full-width figure |
| `[text](aff:url)` | affiliate link — rendered with `rel="nofollow sponsored"` |
| two or more image lines with no blank line between them | side-by-side gallery grid |

Images can appear anywhere between paragraphs, in any number — this is the
whole point of the format, so don't replace it with a fixed image slot.
Article images are hosted in the Supabase Storage `media` bucket; the cover
image goes in `articles.cover_image_url` (a bare URL, no syntax).

When extending the format, add the block type in `lib/article-content.ts`
first, then a case in `ArticleBody` — never parse content inside a page
component.

## Conventions

- One component per file, PascalCase filenames matching the export.
- Articles (Trending News + `/article/[slug]`) are backed by Supabase via
  `lib/articles.ts` — see "Content data (Supabase)" above. Everything else
  still uses static demo data inline in the component/page that renders it
  (`ExtrasCryptoNews.tsx`, `app/[locale]/codes/page.tsx`,
  `app/[locale]/products/page.tsx`), keyed by locale (`Record<Locale, T[]>`).
  When wiring a real source for those too, replace the records with fetched
  (already-localized) data — keep the component's rendering logic and
  translation keys unchanged where possible so `messages/*.json` stays valid.
- Site-wide constants (Telegram URL, other-platform links, site name) live
  in `lib/site.ts` — edit them there once, never inline.
- Keep sections self-contained: a section component should not reach into
  another section's state.

## Where to look first

- `tasks.md` — current task breakdown and status
- `i18n/routing.ts` / `middleware.ts` — locale routing, add new locales here
- `messages/*.json` — all copy
- `app/globals.css` — design tokens (`@theme`) + base styles + custom utilities
- `lib/site.ts` — Telegram/platform links, site constants, and `SITE_URL`
  (from `NEXT_PUBLIC_SITE_URL`, inlined at build — a redeploy is required
  after changing it; it drives canonical, hreflang, OG, sitemap and robots)
- `app/sitemap.ts` / `app/robots.ts` — generated from the routing locales and
  the published articles; add new static pages to `STATIC_PAGES` in sitemap.ts
- `components/` — one file per homepage section

# tasks.md — steploot

Status legend: `[ ]` todo · `[~]` in progress · `[x]` done

## 1. Foundation
- [x] Project scaffold: Next.js 15 + TypeScript + Tailwind **v4**
- [x] i18n setup: ar (default, RTL) / en / fr / es via next-intl v4
- [x] Design tokens (colors, fonts) defined via `@theme` in `app/globals.css`
      (Tailwind v4 — no `tailwind.config` file)
- [x] Site-wide visual direction set: **warm minimal** (off-white/beige, deep-green
      accent, gold for codes) applied to every page, replacing the dark teal theme
- [x] Article pages split into their own chrome via route groups —
      `(site)` vs `(reader)` — so opening an article feels like a separate publication
- [x] First homepage draft built with static/demo content (superseded — see below)
- [x] Rebuild homepage to the revised structure: Header, Hero, Trending News,
      Extras & Crypto News (3rd section — includes Telegram + other-platform
      links), Footer. Standalone Products and Codes-strip sections removed
      from the homepage. *(rebuilt 2026-08 on Next.js 15 + Tailwind v4)*
- [x] Content source decided: **Supabase** (`articles` + `article_translations`
      tables, read through the `published_articles` view — see
      `supabase/schema.sql`). Articles are managed manually from the Supabase
      Table Editor for now (no admin panel yet). Site falls back to local
      demo articles automatically until `NEXT_PUBLIC_SUPABASE_URL` /
      `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set — see `.env.local.example`.
- [~] Deploy + domain: hosting decided as **Vercel** (middleware + ISR work with
      zero config; a pure static host can't run the locale middleware). Domain
      purchase and DNS still to do — steps in README.
- [x] SEO plumbing that depends on the domain: canonical + hreflang for all four
      locales, `app/sitemap.ts` (static pages + every published article),
      `app/robots.ts`, `metadataBase` and Open Graph — all driven by
      `NEXT_PUBLIC_SITE_URL` (build-time; redeploy after changing it)

- [x] All site copy moved to Supabase (`site_content`), overriding the repo
      message files — every page's text is editable without a redeploy
- [x] Admin panel at `/[locale]/admin` — login, article editor, paste/drag image
      upload to Storage, site-text editing; access gated by the `admins` table

## 2. Pages still needed
- [x] `/[locale]/article/[slug]` — article page (minimal layout), reads from Supabase
      (`lib/articles.ts`) with automatic fallback to demo content. Supports images
      anywhere in the body, any number, via the content syntax documented in
      AGENTS.md; images hosted in the Supabase Storage `media` bucket. Still needs:
      in-article hidden code placement (top / mid x2-3 / end) once the codes
      system (§5) is built — this will be the *only* place promo codes are distributed
- [~] `/[locale]/codes` — archive page for browsing past codes (not linked
      from the homepage, but still useful for reference/SEO)
      *(stub built with demo tickets — connect to real code data source)*
- [x] `/[locale]/products` — standalone affiliate products page, now fully
      data-driven (`products` + `product_translations` in Supabase) and managed
      from the admin panel's "المنتجات" tab: price, image upload, affiliate URL
      with rel="nofollow sponsored", ordering, draft/published, four locales
- [x] `/[locale]/privacy` — real privacy policy written in all four locales
      (cookies, AdSense/third-party vendors with opt-out links, affiliate and
      Red Packet disclosure, GDPR rights, children, contact). Editable from the
      admin panel's "الصفحات" tab.
- [x] `/[locale]/terms` — real terms of use in all four locales (not-financial-advice
      disclaimer for crypto, code/offer terms, affiliate links, IP, liability,
      governing law).
- [x] `/[locale]/about` — about page written in all four locales with coverage
      areas, editorial approach and a contact address.
- [ ] Create the `contact@steploot.com` mailbox (domain is on Zoho) — the policies
      and about page reference it, and AdSense checks that contact details work.

## 3. Content pipeline
- [ ] Set up RSS/source list for tech news (English-language sources) to
      monitor daily
- [ ] Build or choose an AI-assisted rewrite step so articles are original
      (not translated verbatim) — see AGENTS.md compliance rules
- [ ] Weekly content calendar in place (see content pillars below)
- [ ] Telegram bot: auto-post to channel whenever a new article publishes

### Content pillars (recurring weekly slots)
| Day | Content type |
|---|---|
| Sat | Phone news |
| Sun | AI news |
| Mon | Software/app news |
| Tue | Product review (affiliate) |
| Wed | General tech news |
| Thu | "Top 5" or comparison (affiliate) |
| Fri | Weekly recap + Red Packet code + Telegram contest |

## 4. Monetization
- [ ] Publish 10–15 real articles + all policy pages before applying to
      AdSense (AdSense rejects near-empty sites)
- [ ] Apply for AdSense (Auto ads to start; refine placements later)
- [ ] Apply to Amazon Associates
- [ ] Evaluate 1–2 Web3/CPM ad networks as an AdSense alternative/supplement
- [ ] Implement ad placements: sticky sidebar (desktop), anchor ad (mobile),
      in-article ad every 2–3 paragraphs — respecting the 3-ads-per-screen
      and no-adjacent-ads rules in AGENTS.md

## 4.5 Homepage "Extras & Crypto News" section
- [x] Design the section: crypto currency news feed (separate from general
      tech news in the Trending section above it) — now driven by real published
      articles whose category matches `app_config.crypto_category`, each row
      linking to its article page
- [x] Add Telegram channel link/CTA inside this section
      *(URL is a placeholder in `lib/site.ts` — set the real channel)*
- [x] Other-platform links moved to the Supabase `platforms` table — rows can be
      added, reordered or disabled without a deploy; empty URLs are hidden, so the
      final list is now a content decision rather than a code change

## 5. Promo codes system
- [ ] Decide how codes are generated/managed (manual entry vs admin panel)
- [x] In-article code component built: `((CODE))` written by hand inside the
      article text renders quietly inline (`components/InlineCode.tsx`) —
      real text, click-to-copy, no ticket/banner in body copy
- [ ] Connect the `/codes` page + in-article codes to the same data source

## 6. Launch checklist (first week, from original plan)
- [ ] Day 1: hosting/domain live
- [~] Day 2: SEO basics — sitemap, canonical/hreflang, robots, OG done; structured data (Article JSON-LD) still to add
- [x] Day 3: privacy policy, terms and about published with real content in 4 languages
- [ ] Day 4: AdSense application submitted
- [ ] Day 5: Telegram channel created and linked from site
- [ ] Day 6: first 5 articles published
- [ ] Day 7: first Red Packet code created and distributed

## 7. Success metrics (first 3 months, targets)
- 500–1000 daily visitors
- $5–20/day ad revenue
- 500–2000 Telegram followers
- $50–200/month affiliate revenue

## Known gaps
- Demo/sample content has been removed entirely; the site renders empty states
  until real articles are published in Supabase.
- Article locale switching: slugs differ per locale, so the reader chrome has no
  language switcher yet. Needs translated-slug lookup by `article_id`.
- All translation messages are serialized into every page payload; consider
  narrowing what's passed to `NextIntlClientProvider` if payload size matters.

## Open decisions
- Ad networks beyond AdSense — not yet evaluated

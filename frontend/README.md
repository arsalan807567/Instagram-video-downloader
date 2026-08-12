# Instagram Video Downloader — MVP

A fast, mobile-first web app for downloading publicly available Instagram
videos and reels. No account, no login, $0 mandatory infrastructure cost.

## ⚠️ Before you deploy this for real users

**This project ships with a `MockMediaProvider` only.** It returns local
demo video files so the entire application — UI, API contract, validation,
security, analytics, SEO — can be built, tested, and reviewed end to end
without depending on any external retrieval mechanism.

There is currently no official, free API that lets a third-party app take
an arbitrary public Instagram post URL and return a downloadable video for
anonymous users. Every implementation that does this reverse-engineers
Instagram's private endpoints, which violates Instagram's Terms of Use,
and facilitates copying other people's copyrighted video content without
their permission — regardless of whether the source account is public.

**You are responsible for deciding how (or whether) to connect a real
media provider**, and for making sure whatever you connect is something
you have the rights and legal basis to operate. The `MediaProvider`
interface (`src/providers/MediaProvider.ts`) exists specifically so this
decision is isolated to one place — see "Connecting a production
provider" below.

---

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router) + TypeScript | Server rendering for SEO pages, edge-function API routes, one deploy target |
| Styling | Tailwind CSS v4 | No runtime cost, fast iteration, small bundle |
| Hosting | Cloudflare Workers (via OpenNext) | Generous free tier, global edge, $0 to start |
| Testing | Vitest (unit) + Playwright (e2e) | Fast unit tests, real-browser e2e against the mock provider |
| Analytics | GA4 + Search Console | Free, industry standard |

No database. No auth system. No paid services required to run the MVP.

## Project structure

```
src/
  app/                    Routes (pages, API, sitemap, robots)
  components/
    downloader/           Form, result card, quality selector, states
    home/                 Homepage sections, FAQ content + structured data
    layout/               Header, footer, nav, GA4 loader
    ui/                   Button, Input, Card primitives
    ads/                  AdSlot placeholder (inert until ads are enabled)
  lib/
    validation/           Server-authoritative + client-UX URL checks
    analytics/            Centralized, privacy-safe event tracking
    rateLimit.ts          IP-based rate limiting
  providers/
    MediaProvider.ts      The interface - THE file to read before adding a provider
    MockMediaProvider.ts  Dev/test implementation
    index.ts              Provider factory (env-driven, prod guardrail)
  services/
    mediaService.ts        Orchestrates validation + provider + error handling
  tests/
    unit/                 Vitest
    e2e/                  Playwright
```

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. `MEDIA_PROVIDER` defaults to `mock`, so the
downloader works immediately with demo video files in `public/demo/`.

### Triggering specific mock scenarios

The mock provider reads the post code from the URL to decide what to
return, so you can exercise every state deterministically:

| URL | Result |
|---|---|
| `instagram.com/reel/success1/` | Full result, 3 qualities |
| `instagram.com/reel/single1/` | Full result, 1 quality only |
| `instagram.com/reel/private1/` | "Not publicly available" error |
| `instagram.com/reel/unavailable1/` | "Media unavailable" error |
| `instagram.com/reel/slow1/` | Success after a 3s delay (tests loading state) |
| `instagram.com/p/photo1/` | Photo result |
| anything else | Generic provider error |

## Testing

```bash
npm run test         # unit tests (Vitest)
npm run test:e2e     # end-to-end (Playwright, uses the mock provider)
npm run lint
```

## Connecting a production media provider

1. Decide on a retrieval mechanism you have the legal right and technical
   basis to operate. Research current Instagram/Meta platform policy
   before building anything — policies and available endpoints change.
2. Implement the `MediaProvider` interface in a new file under
   `src/providers/`, e.g. `src/providers/MyProvider.ts`.
3. Register it in `src/providers/index.ts`'s switch statement.
4. Set `MEDIA_PROVIDER=my-provider` in your environment.
5. `MEDIA_PROVIDER=mock` is rejected at runtime whenever
   `NEXT_PUBLIC_APP_ENV=production` — this is intentional, so a
   misconfigured deploy fails loudly instead of quietly serving demo data.

No other file in the codebase needs to change — the frontend and API
route only ever talk to the `MediaProvider` interface.

## Environment variables

See `.env.example` for the full list with comments. Key ones:

- `NEXT_PUBLIC_APP_ENV` — `development` / `staging` / `production`
- `MEDIA_PROVIDER` — `mock` in dev; a registered real provider in prod
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` — leave unset to disable GA4 entirely
- `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX_REQUESTS` — abuse protection
- `NEXT_PUBLIC_ADS_ENABLED` — keep `false` until an ad provider is wired in

Never commit `.env.local` or any file with real secrets. Only
`.env.example` is tracked in git.

## Deployment (Cloudflare Workers, $0 tier)

See the deployment steps provided separately for the exact commands to
run from a GitHub Codespace terminal, including domain, DNS, and
Search Console setup.

## SEO / AEO

- Five real, unique-content pages: `/`, `/instagram-video-downloader`,
  `/instagram-reels-downloader`, `/how-to-download-instagram-videos`, `/faq`
- Per-page metadata, canonical URLs, OG/Twitter tags, `sitemap.xml`,
  `robots.txt` (disallows `/api/*`)
- `FAQPage` structured data on the FAQ content for answer-engine visibility
- Copy is written to answer real questions directly — no keyword stuffing

## Security

- Server-side URL validation is authoritative: strict HTTPS-only,
  exact-hostname allowlist (not substring matching), path-shape check,
  length cap
- Security headers via middleware: CSP, `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`, restrictive `Permissions-Policy`
- IP-based rate limiting on `/api/media`, request body size cap,
  provider-call timeout
- Generic, non-leaking error messages; internal errors get a UUID logged
  server-side instead of a stack trace sent to the client
- No secrets in client-side code; provider credentials (once added) must
  only ever be read server-side

## Analytics & privacy

- Centralized `track()` wrapper in `src/lib/analytics/track.ts` enforces
  an allowlist of event names and param keys — nothing outside that list
  can be sent, even by accident
- Never sends raw URLs, cookies, tokens, or credentials — only
  categorical values (`content_type`, `download_quality`, `result`, etc.)
- GA4 loads via `next/script` with `afterInteractive`, so it never blocks
  first paint, and only loads at all when `NEXT_PUBLIC_APP_ENV=production`
  and an ID is configured

Before launch: review applicable privacy/consent requirements for your
target markets and update `/privacy-policy` accordingly — the page has
placeholder text marking exactly where that's needed.

## Known limitations of this MVP

- No real media retrieval provider is included (see warning at the top)
- Rate limiting is in-memory per Worker instance, not globally
  coordinated — fine for stopping casual abuse, not a substitute for
  Cloudflare's dashboard-level Rate Limiting Rules at real scale
- No database, no download history, no accounts — by design

# Reelfetch — Instagram Video Downloader

A fast, simple web-based Instagram video downloader for publicly accessible Instagram videos and Reels. Live at [reelfetch.online](https://reelfetch.online).

## Features

- Download public Instagram videos and Reels
- No Instagram account required
- Choose from the video qualities actually available
- Automatic bot protection (Cloudflare Turnstile, invisible mode - no user interaction required)
- Works on desktop and mobile browsers
- Simple URL-based workflow
- Responsive interface
- FAQ and how-to documentation
- SEO and AEO-friendly structured data
- robots.txt and XML sitemap

## Project Structure

```text
Instagram-video-downloader/
├── frontend/                  # Next.js frontend and web application
│   ├── src/app/                # Pages, metadata, sitemap and robots.txt
│   ├── src/components/         # UI components
│   ├── src/providers/          # Media provider abstraction (FastAPI / mock)
│   └── src/lib/                # Application utilities and analytics
│
└── instagram-downloader-api/  # FastAPI backend (yt-dlp based media resolution)
```

## Tech Stack

- Next.js (App Router) + Turbopack
- React
- TypeScript
- Tailwind CSS
- Cloudflare Turnstile (bot verification)
- FastAPI + yt-dlp
- Python
- Cloudflare Workers (via OpenNext) for frontend deployment
- Render for backend deployment
- cron-job.org for backend keep-alive pings

## Supported Content

The downloader is designed for publicly accessible Instagram videos and Reels. Private accounts and content that is not publicly accessible are not supported.

## How It Works

1. Copy the URL of a public Instagram video or Reel.
2. Paste the URL into the downloader.
3. Click Download. A bot-verification check runs automatically in the background - no puzzles or checkboxes for real visitors.
4. Choose an available video quality.
5. Download the video to your device.

## SEO and AEO

The frontend includes search-engine and answer-engine optimization features including:

- XML sitemap
- robots.txt
- Canonical URLs
- Open Graph metadata
- Twitter metadata
- FAQPage structured data
- HowTo structured data
- WebApplication structured data
- BreadcrumbList structured data
- Semantic page headings and content
- Google Search Console verified, sitemap submitted

## Security

- Content-Security-Policy, X-Frame-Options, and other hardening headers set via middleware
- Cloudflare Turnstile bot verification, enforced server-side (not just client-side)
- Per-IP rate limiting on the download endpoint
- Request body size limits
- CORS restricted to explicitly allowed origins (comma-separated via `FRONTEND_URL`)
- No secrets committed to the repository - see `.env.example` files for required variables

## Development

```bash
cd frontend
npm install
npm run dev
```

For a production build:

```bash
npm run build
```

Run tests and type-checking before committing:

```bash
npx tsc --noEmit
npx eslint .
npm run test
```

## Environment Variables

See `frontend/.env.example` and `instagram-downloader-api/.env.example` for the full list. Notably:

- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` - required for bot verification to be active. Verification is skipped (fail-open) if the secret key isn't set, so the app still works without it, just without bot protection.
- `MEDIA_PROVIDER` - must be `fastapi` in production; `mock` is only for local development.
- `FRONTEND_URL` (backend) - comma-separated list of allowed CORS origins. Must include every domain the frontend is actually served from.

## Deployment

The frontend is deployed to Cloudflare Workers (via `@opennextjs/cloudflare`):

```bash
cd frontend
npm run cf:deploy
```

The FastAPI backend is deployed separately to Render. Because Render's free tier spins down after ~15 minutes of inactivity, a free external cron job pings `/health` every 10 minutes to keep it warm.

Before deploying, configure the required environment variables for both the frontend (Cloudflare Worker vars/secrets) and backend (Render dashboard).

## Legal and Privacy

This project is an independent tool and is not affiliated with, endorsed by, or sponsored by Instagram or Meta Platforms, Inc.

Users are responsible for ensuring they have the necessary rights or permission to download and use content.

The service is intended only for publicly accessible content and does not bypass private accounts or privacy settings.

## License

This project does not currently specify an open-source license.

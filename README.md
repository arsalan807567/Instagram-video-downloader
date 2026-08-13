# Instagram Video Downloader

A fast, simple web-based Instagram video downloader for publicly accessible Instagram videos and Reels.

## Features

- Download public Instagram videos and Reels
- No Instagram account required
- Choose from the video qualities actually available
- Works on desktop and mobile browsers
- Simple URL-based workflow
- Responsive interface
- FAQ and how-to documentation
- SEO and AEO-friendly structured data
- robots.txt and XML sitemap

## Project Structure

```text
Instagram-video-downloader/
├── frontend/              # Next.js frontend and web application
│   ├── src/app/           # Pages, metadata, sitemap and robots.txt
│   ├── src/components/   # UI components
│   └── src/lib/          # Application utilities and analytics
│
└── instagram-downloader-api/  # FastAPI backend
```

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- FastAPI
- Python
- Vercel for frontend deployment
- Render for backend deployment

## Supported Content

The downloader is designed for publicly accessible Instagram videos and Reels. Private accounts and content that is not publicly accessible are not supported.

## How It Works

1. Copy the URL of a public Instagram video or Reel.
2. Paste the URL into the downloader.
3. Click Download.
4. Choose an available video quality.
5. Download the video to your device.

## SEO and AEO

The frontend includes search-engine and answer-engine optimization features including:

- XML sitemap
- robots.txt
- Canonical URLs
- Open Graph metadata
- Twitter metadata
- FAQ structured data
- HowTo structured data
- WebApplication structured data
- BreadcrumbList structured data
- Semantic page headings and content

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

## Deployment

The frontend can be deployed to Vercel and the FastAPI backend can be deployed separately.

Before deploying, configure the required environment variables for the frontend and backend.

## Legal and Privacy

This project is an independent tool and is not affiliated with, endorsed by, or sponsored by Instagram or Meta Platforms, Inc.

Users are responsible for ensuring they have the necessary rights or permission to download and use content.

The service is intended only for publicly accessible content and does not bypass private accounts or privacy settings.

## License

This project does not currently specify an open-source license.

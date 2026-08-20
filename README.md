# Townsville Bushwalking Club - Events Calendar

A modern Next.js web application (TypeScript) that extracts Facebook events from the Townsville Bushwalking Club page and displays them in a calendar interface with a REST API and iCal feeds.

Production site: [events.townsvillebushwalkingclub.com](https://events.townsvillebushwalkingclub.com/)

## Features

- 📅 **Interactive Calendar View** - Monthly calendar with event indicators and mobile-friendly layout
- 🎯 **Facebook Events Integration** - Live events from your Facebook page with in-memory and file caching
- 📆 **iCal Calendar Feeds** - Subscribeable feed of upcoming events; per-event `.ics` downloads
- 🖼️ **Event Thumbnails** - Cover images from Facebook events with local fallbacks
- ⏰ **Start & End Times** - Complete time information, including multi-day events (Australia/Brisbane)
- 📄 **Individual Event Pages** - Dedicated pages with SEO metadata, JSON-LD, and prev/next navigation
- 🔎 **Search & Browse** - Search events and browse the full event list
- 🗺️ **Sitemap Generation** - Dynamic sitemap for event and calendar pages
- 🔄 **REST API** - JSON endpoints for programmatic access
- 📱 **Responsive Design** - Works on desktop and mobile devices
- ⚡ **Modern Tech Stack** - Next.js, React, TypeScript, and Tailwind CSS
- 🚀 **Vercel Ready** - Optimized for deployment on Vercel
- 🔗 **Embed Widget** - JavaScript snippet for embedding events on other websites
- 💾 **Historical Data Storage** - Past events saved to JSON files to reduce API calls
- 🔍 **SEO Optimized** - Metadata, Open Graph, Twitter cards, and schema.org JSON-LD
- 🖨️ **Monthly Posters** - Printable poster pages at `/poster/[month]` (save as PDF from the browser)
- 🤖 **llms.txt** - Machine-readable club and events summary for AI systems
- 👤 **humans.txt** - Credits for the people behind the site

## Quick Start

### Prerequisites

- Node.js 26+
- Facebook Developer Account
- Facebook Page Access Token
- npm

### Installation

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd tbwc
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file:

   ```text
   FACEBOOK_ACCESS_TOKEN=your_facebook_page_access_token_here
   FACEBOOK_PAGE_ID=your_facebook_page_id_here
   ```

   Optional:

   ```text
   FACEBOOK_APP_ID=your_facebook_app_id_here
   NEXT_PUBLIC_SITE_URL=https://events.townsvillebushwalkingclub.com
   CORS_ALLOWED_ORIGINS=https://townsvillebushwalkingclub.com
   ```

   `FACEBOOK_APP_ID` is public and safe to expose. When set, pages include `<meta property="fb:app_id">` for Meta Sharing Debugger / Domain Insights. Never put `FACEBOOK_APP_SECRET` in the Next.js app env used for the site (keep it for local `npm run token:refresh` only).

4. **Get Facebook Access Token**
   - Go to [Facebook Graph API Explorer](https://developers.facebook.com/tools/explorer/)
   - Select your app or create a new one
   - Add permissions: `pages_read_engagement`, `pages_show_list`
   - Generate access token
   - Copy the token to `.env.local`

5. **Start the development server**

   ```bash
   npm run dev
   ```

6. **Open your browser**
   - Calendar: <http://localhost:3000>
   - API: <http://localhost:3000/api/events>
   - iCal feed: <http://localhost:3000/api/calendar/feed>

## API Endpoints

### JSON event API

These return JSON with `success`, `data`, and `timestamp` fields (where applicable). Events include name, description, times, location, attendance stats, and cover images.

- `GET /api/events` - Upcoming events (approx. 2022 through ~3 months ahead)
- `GET /api/events/{year}/{month}` - Events for a specific month (e.g. `/api/events/2026/3`)
- `GET /api/event/{id}` - Single event by Facebook event ID
- `GET /api/events/search?q=` - Search events by name or description

### Calendar feeds

- `GET /api/calendar/feed` - Subscribeable iCal feed (`text/calendar`) of upcoming events
- `GET /api/event/{id}/calendar` - Download a single event as `.ics` (`text/calendar`)

Subscribe in Google Calendar, Apple Calendar, or Outlook using the feed URL. The feed updates as Facebook event data changes.

### Other routes

- `GET /events/{id}/cover` - Event cover image (JPEG/PNG) used for Open Graph and Messenger previews
- `GET /api/embed-snippet` - JavaScript embed widget for external sites
- `GET /llms.txt` - Markdown guide for AI systems (club info and upcoming events). Includes a Brisbane `Last updated` ISO 8601 stamp and per-event ISO start/end times. Discovered via `rel="describedby"` (HTML link + HTTP `Link` header)
- `GET /humans.txt` - Credits for site authors and tech stack
- `GET /poster/{yyyy-mm}` - Printable monthly poster (HTML; print/save as PDF from the browser). Optional query params:
  - `include=id1,id2` - force-include those Facebook event IDs on the poster (any month; still capped at 12 current / 5 next-month teaser)
  - `exclude=id1,id2` - hide those event IDs from the poster
  - `featured=id` - pin that event as the large/hero walk when the layout allows (also force-includes it)
  - `theme=nature|simple` - poster visual theme (`nature` is the default)
  - Past months with no upcoming events show a notice linking to the current month poster (instead of the empty-events message)

## Development

### npm scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run token:refresh` | Refresh Facebook access token |
| `npm run download:history` | Bulk-download historical events to `data/events/` |
| `npm run month:sync` | Archive previous month to JSON |
| `npm run covers:sync` | Sync event cover images |
| `npm run sync:cancelled` | Sync cancelled event IDs |

### Project Structure

```text
tbwc/
├── app/                        # Next.js App Router
│   ├── page.tsx                # Homepage calendar + subscribe section
│   ├── layout.tsx              # Root layout and metadata
│   ├── events/
│   │   ├── [id]/               # Event detail pages
│   │   │   └── cover/          # Cover image for Open Graph
│   │   ├── all/                # Full event list
│   │   └── search/             # Event search UI
│   ├── poster/[month]/         # Printable monthly posters
│   ├── components/             # Calendar, EventSearch, CalendarSubscribe, etc.
│   ├── api/
│   │   ├── events/             # JSON events API
│   │   │   ├── route.ts
│   │   │   ├── search/
│   │   │   └── [year]/[month]/
│   │   ├── event/[id]/         # Single event JSON + .ics download
│   │   ├── calendar/feed/      # iCal subscription feed
│   │   └── embed-snippet/      # Embed widget script
│   ├── llms.txt/               # llms.txt route
│   ├── sitemap.ts
│   └── robots.ts
├── lib/                        # Shared logic
│   ├── facebook-api.ts         # Facebook Graph API + caching
│   ├── calendar-ics.ts         # iCal generation
│   ├── calendar-feed-events.ts
│   ├── event-utils.ts
│   ├── event-json-ld.ts        # Schema.org JSON-LD
│   └── use-past-check-time.ts  # Client past/upcoming clock hook
├── types/event.ts              # TBWCEvent and related types
├── tools/                      # Maintenance scripts (tsx)
├── data/events/                # Past events JSON (YYYY/MM.json)
└── public/
    ├── humans.txt              # Site credits
    └── event-covers/           # Local event cover images
```

## Facebook API Setup

### Required Permissions

- `pages_read_engagement` - Read page events
- `pages_show_list` - Access page information

### Token Management

Tokens expire periodically. To refresh:

```bash
npm run token:refresh
```

This runs the TypeScript tool with `tsx` and converts short-lived tokens to long-lived (60 days) or fetches a **Page Access Token** (never expires, recommended for production).

The app handles token expiration gracefully with cached data and clear error messages.

### Historical Events

Past events are archived to `data/events/YYYY/MM.json` by the **Archive Previous Month** GitHub Action at **1:00 AM Brisbane** on the 1st of each month (see `.github/workflows/sync-month.yml`). Archives are committed to git and deployed to Vercel; production does not write to disk (Vercel's filesystem is read-only).

To backfill or recover a missed month manually:

- **GitHub Actions:** open **Archive Previous Month** and click **Run workflow**
- **Local:** `npm run month:sync` then commit and push `data/events/` and cover assets

Bulk historical download:

```bash
npm run download:history
```

Downloads events from 2020 onwards, handles rate limits, and resumes if interrupted.

### Configuration

The app fetches events from the Facebook page identified by `FACEBOOK_PAGE_ID` (default club page: [townsvillebushwalkingclub](https://www.facebook.com/townsvillebushwalkingclub/)). Set `FACEBOOK_PAGE_ID` and `FACEBOOK_ACCESS_TOKEN` in `.env.local`.

Optional: set `FACEBOOK_APP_ID` so Open Graph pages emit `fb:app_id` (associates shares with the club Meta app). Required for `npm run token:refresh` together with `FACEBOOK_APP_SECRET` (secret stays server/local only).

## Troubleshooting

### Facebook access token is required

- Check `.env.local` has `FACEBOOK_ACCESS_TOKEN` and `FACEBOOK_PAGE_ID` set
- Verify token is valid in Graph API Explorer

### Failed to fetch page info

- Ensure page is public or token has proper permissions
- Confirm `FACEBOOK_PAGE_ID` matches the target page

### No events data found

- Verify page has published events
- Check event privacy settings

Add `DEBUG=true` to `.env.local` for detailed logging. For more help, check Facebook API documentation or open an issue on GitHub.

## Embed Widget

Embed events on your website with a simple JavaScript snippet. The script automatically detects development/production environments.

```html
<div id="tbwc-events"></div>
<script src="https://your-domain.com/api/embed-snippet?v=1"></script>
```

For local testing, use `http://localhost:3000/api/embed-snippet?v=1`. Test pages available at [/test-embed.html](https://events.townsvillebushwalkingclub.com/test-embed.html).

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Assets

[SVG Leaves by Susrut, Vectordad](https://vectordad.com/designs/leaves-svg/) used in the nature themed poster.

## License

ISC License - see LICENSE file for details.

---

Built with ❤️ for the [Townsville Bushwalking Club](https://townsvillebushwalkingclub.com/)

# Townsville Bushwalking Club - Events Calendar

A modern Next.js web application (TypeScript) that extracts Facebook events from the Townsville Bushwalking Club page and displays them in a beautiful calendar interface with a REST API.

## Features

- 📅 **Interactive Calendar View** - Monthly calendar with event indicators
- 🎯 **Facebook Events Integration** - Real-time events from your Facebook page
- 🖼️ **Event Thumbnails** - Cover images from Facebook events with fallback icons
- ⏰ **Start & End Times** - Complete time information for events
- 📄 **Individual Event Pages** - Dedicated pages for each event with full details and SEO metadata
- 🗺️ **Sitemap Generation** - A sitemap listing all event and calendar pages for better search engine indexing.
- 🔄 **REST API** - JSON endpoints for programmatic access
- 📱 **Responsive Design** - Works on desktop and mobile devices
- ⚡ **Modern Tech Stack** - Built with Next.js, React, TypeScript, and Tailwind CSS
- 🎨 **Beautiful UI** - Modern gradient design with smooth animations
- 🚀 **Vercel Ready** - Optimized for deployment on Vercel
- 🔗 **Embed Widget** - JavaScript snippet for embedding events on other websites
- 💾 **Historical Data Storage** - Past events saved to files to reduce API calls
- 🔍 **SEO Optimized** - Comprehensive metadata for search engines and social sharing

## Quick Start

### Prerequisites

- Node.js 18+
- Facebook Developer Account
- Facebook Page Access Token
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd tbwc-events
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file and add your Facebook access token:

   ```text
   FACEBOOK_ACCESS_TOKEN=your_facebook_access_token_here
   ```

4. **Get Facebook Access Token**
   - Go to [Facebook Graph API Explorer](https://developers.facebook.com/tools/explorer/)
   - Select your app or create a new one
   - Add permissions: `pages_read_engagement`, `pages_show_list`
   - Generate access token
   - Copy the token to your `.env` file

5. **Start the development server**

   ```bash
   npm run dev
   ```

6. **Open your browser**
   - Calendar: <http://localhost:3000>
   - API: <http://localhost:3000/api/events>

## API Endpoints

- `GET /api/events` - Get all events
- `GET /api/events/{year}/{month}` - Get events for a specific month (e.g., `/api/events/2024/1`)
- `GET /api/event/{id}` - Get a single event by ID
- `GET /api/events/search?q=` - Search events by name or description
- `GET /api/calendar/feed` - iCal feed of upcoming events
- `GET /llms.txt` - Markdown guide for AI systems (club info and upcoming events)

All endpoints return JSON with `success`, `data`, and `timestamp` fields. Events include name, description, times, location, attendance stats, and cover images.

## Development

### Project Structure

```text
tbwc-events/
├── app/                   # Next.js App Router (TypeScript)
│   ├── page.tsx           # Main calendar page
│   ├── layout.tsx         # Root layout with metadata
│   ├── events/            # Event detail pages
│   │   └── [id]/          # Individual event pages
│   ├── components/        # React components (.tsx)
│   │   ├── Calendar.tsx   # Calendar component
│   │   └── EventsList.tsx # Events list component
│   └── api/               # API routes (.ts)
│       ├── events/        # Events API endpoints
│       │   ├── [id]/      # Single event endpoint
│       │   └── [year]/[month]/ # Monthly events
│       ├── embed-snippet/ # Embed widget script
│       └── calendar/      # iCal subscription feed
│   └── llms.txt/          # AI-readable site guide (llms.txt)
├── lib/                   # Library and shared logic (.ts)
│   └── facebook-api.ts   # Facebook API integration
├── types/                 # Shared TypeScript types
│   └── event.ts           # Event and related types
├── tools/                 # Utility scripts (TypeScript, run with tsx)
│   ├── get-long-lived-token.ts      # Token refresh tool
│   └── download-historical-events.ts # Historical data download
├── data/                  # Data storage
│   └── events/            # Past events JSON files (YYYY/MM.json)
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── next.config.ts        # Next.js configuration
└── .env.local             # Environment variables
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

Past events are automatically saved to `data/events/YYYY/MM.json` to reduce API calls. To download historical data:

```bash
npm run download:history
```

Downloads events from 2020 onwards, handles rate limits, and resumes if interrupted.

### Configuration

The app fetches events from `https://www.facebook.com/townsvillebushwalkingclub/`. To change the page, update `FACEBOOK_PAGE_ID` in the API routes.

## Troubleshooting

### Facebook access token is required

- Check `.env.local` has `FACEBOOK_ACCESS_TOKEN` set
- Verify token is valid in Graph API Explorer

### Failed to fetch page info

- Ensure page is public or token has proper permissions
- Check page username in API routes

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

[SVG Leaves by Susrut, Vectordad](https://vectordad.com/designs/leaves-svg/)

## License

ISC License - see LICENSE file for details.

---

Built with ❤️ for the [Townsville Bushwalking Club](https://townsvillebushwalkingclub.com/)

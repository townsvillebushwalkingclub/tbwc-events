# Townsville Bushwalking Club - Events Calendar

A modern Next.js web application that extracts Facebook events from the Townsville Bushwalking Club page and displays them in a beautiful calendar interface with a REST API.

## Features

- 📅 **Interactive Calendar View** - Monthly calendar with event indicators
- 🎯 **Facebook Events Integration** - Real-time events from your Facebook page
- 🖼️ **Event Thumbnails** - Cover images from Facebook events with fallback icons
- ⏰ **Start & End Times** - Complete time information for events
- 📄 **Individual Event Pages** - Dedicated pages for each event with full details and SEO metadata
- 🗺️ **Sitemap Generation** - A sitemap listing all event and calendar pages for better search engine indexing.
- 🔄 **REST API** - JSON endpoints for programmatic access
- 📱 **Responsive Design** - Works on desktop and mobile devices
- ⚡ **Modern Tech Stack** - Built with Next.js, React, and Tailwind CSS
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

### Get All Events

```http
GET /api/events
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "123456789",
      "name": "Mountain Hike",
      "description": "Join us for a beautiful mountain hike...",
      "start_time": "2024-01-15T09:00:00+1000",
      "end_time": "2024-01-15T17:00:00+1000",
      "place": {
        "name": "Mount Stuart",
        "city": "Townsville",
        "state": "QLD"
      },
      "attending_count": 15,
      "interested_count": 25,
      "formatted_date": "Monday, January 15th, 2024",
      "formatted_time": "9:00 AM",
      "formatted_end_time": "5:00 PM",
      "formatted_end_date": "Monday, January 15th, 2024",
      "is_multi_day": false,
      "cover": {
        "source": "https://scontent.xx.fbcdn.net/v/...",
        "width": 720,
        "height": 405
      }
    }
  ],
  "timestamp": "2024-01-10T10:30:00.000Z"
}
```

### Get Events by Month

```http
GET /api/events/{year}/{month}
```

**Example:**

```http
GET /api/events/2024/1
```

### Get Single Event

```http
GET /api/event/{id}
```

**Example:**

```http
GET /api/event/123456789
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "123456789",
    "name": "Mountain Hike",
    "description": "Join us for a beautiful mountain hike...",
    "start_time": "2024-01-15T09:00:00+1000",
    "end_time": "2024-01-15T17:00:00+1000",
    "formatted_date": "Monday, January 15th, 2024",
    "formatted_time": "9:00 AM",
    "formatted_end_time": "5:00 PM",
    "place": {
      "name": "Mount Stuart"
    },
    "attending_count": 15,
    "interested_count": 25,
    "cover": {
      "source": "https://scontent.xx.fbcdn.net/v/...",
      "width": 720,
      "height": 405
    }
  },
  "timestamp": "2024-01-10T10:30:00.000Z"
}
```

### Health Check

```http
GET /health
```

## Development

### Running in Development Mode

```bash
npm run dev
```

### Project Structure

```text
tbwc-events/
├── app/                  # Next.js App Router
│   ├── page.js          # Main calendar page
│   ├── layout.js        # Root layout with metadata
│   ├── events/          # Event detail pages
│   │   └── [id]/        # Individual event pages
│   ├── components/       # React components
│   │   ├── Calendar.js   # Calendar component
│   │   └── EventsList.js # Events list component
│   └── api/             # API routes
│       ├── events/      # Events API endpoints
│       │   ├── [id]/    # Single event endpoint
│       │   └── [year]/[month]/ # Monthly events
│       ├── embed-snippet/ # Embed widget script
│       └── health/       # Health check endpoint
├── lib/                  # Library functions
│   └── facebook-api.js   # Facebook API integration
├── tools/                # Utility scripts
│   ├── get-long-lived-token.js # Token refresh tool
│   └── download-historical-events.js # Historical data download
├── data/                 # Data storage
│   └── events/           # Past events JSON files (YYYY/MM.json)
├── package.json          # Dependencies and scripts
├── next.config.js        # Next.js configuration
└── .env.local            # Environment variables
```

## Facebook API Setup

### Required Permissions

- `pages_read_engagement` - Read page events
- `pages_show_list` - Access page information

### Getting Access Token

1. Visit [Facebook Developers](https://developers.facebook.com/)
2. Create a new app or use existing one
3. Go to Graph API Explorer
4. Select your app
5. Add required permissions
6. Generate access token
7. Copy token to `.env` file

### Token Management

Facebook access tokens expire periodically. This project includes tools to help manage token refresh:

#### Quick Token Refresh

```bash
# 1. Get a new short-lived token from Graph API Explorer
# 2. Add it to your .env.local file
# 3. Run the refresh script:
npm run token:refresh
# or
node tools/get-long-lived-token.js
```

This script will:

- Convert your short-lived token to a long-lived token (60 days)
- Automatically fetch a **Page Access Token** that never expires
- Display the new token to update in your environment variables

#### Token Types

The project supports two types of tokens:

1. **Long-lived User Token** (60 days)
   - Requires manual refresh every ~60 days
   - Use for development/testing

2. **Page Access Token** (never expires)  ✨ **Recommended**
   - Never expires unless permissions are revoked
   - Automatically obtained by the refresh script
   - Best for production use

### Token Expiration Handling

The application includes automatic fallback mechanisms when tokens expire:

- ✅ Uses cached data (24-hour cache)
- ✅ Shows sample events in development mode
- ✅ Provides clear error messages with refresh instructions
- ✅ Graceful degradation in production

### Historical Events Storage

The application automatically saves past events to JSON files to reduce Facebook API calls:

- **Automatic Storage**: Past events are saved to `data/events/YYYY/MM.json`
- **File-based Lookup**: Past months are loaded from files instead of Facebook API
- **Download Script**: Use `npm run download:history` to download historical events from 2020 onwards

#### Downloading Historical Events

To populate historical event data:

```bash
npm run download:history
# or
node tools/download-historical-events.js
```

This script will:

- Download events from January 2020 to the previous month
- Save events to `data/events/YYYY/MM.json` files
- Handle rate limits gracefully and save progress
- Resume from where it left off if interrupted
- Track progress in `data/download-progress.json`

**Note**: The script respects Facebook API rate limits and will stop if rate limited. Simply run it again the next day to continue.

### Page Configuration

The app is configured to fetch events from: `https://www.facebook.com/townsvillebushwalkingclub/`

To change the page, update the `FACEBOOK_PAGE_ID` constant in the API routes.

### Calendar Interface

- **Month Navigation** - Navigate between months
- **Event Indicators** - Visual dots show days with events
- **Today Highlight** - Current day is highlighted
- **Event Details** - Click to see full event information

### API Features

- **CORS Enabled** - Cross-origin requests supported
- **Error Handling** - Comprehensive error responses
- **Data Formatting** - Consistent JSON structure
- **Health Monitoring** - Health check endpoint
- **Caching** - Built-in Next.js caching with revalidation

### Caching Strategy

The application uses Next.js Incremental Static Regeneration (ISR) for optimal performance:

- **Past Events**: Pre-generated at build time (SSG) as fully static pages. Since past events are immutable (they never change on Facebook), they are only included in `generateStaticParams` and are fully static with no revalidation needed.
- **Future Events**: Dynamically rendered on-demand when accessed, then cached and revalidated daily (1 day) to pick up any updates or changes. Future events are NOT pre-generated at build time.
- **API Routes**: Cached for 1 day with revalidation for current/future events. Past events are cached indefinitely (immutable).
- **Sitemap & Robots**: Cached for 1 day, regenerated daily to include new events.

**Note**: Next.js doesn't support per-route revalidation in the same dynamic segment. The route-level `revalidate` setting applies to all routes, but for past events (which are pre-generated and immutable), revalidation is effectively a no-op since the data never changes.

### Event Data

Each event includes:

- Basic info (name, description, times)
- Location details
- Attendance statistics
- Formatted dates and times
- Facebook event ID

## Troubleshooting

### Common Issues

"Facebook access token is required"

- Check your `.env.local` file has `FACEBOOK_ACCESS_TOKEN` set
- Verify the token is valid in Graph API Explorer

"Failed to fetch page info"

- Ensure your page is public or your token has proper permissions
- Check the page username in `facebook-api.js`

"No events data found"

- Verify your page has published events
- Check event privacy settings

### Debug Mode

Add `DEBUG=true` to your `.env.local` file for detailed logging.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

ISC License - see LICENSE file for details.

## Embed Widget

You can embed upcoming events on your website using our JavaScript widget. The embed script automatically detects whether it's running in development or production and uses the appropriate API endpoints.

### Quick Embed

```html
<div id="tbwc-events"></div>
<script src="https://your-domain.com/api/embed-snippet?v=1"></script>
```

### Development Testing

For local development testing:

```html
<div id="tbwc-events"></div>
<script src="http://localhost:3000/api/embed-snippet?v=1"></script>
```

- **Environment Detection**: Automatically works in both development and production
- **Automatic Updates**: Shows latest events from your API
- **Event Thumbnails**: Displays cover images from Facebook events
- **Complete Time Info**: Shows both start and end times when available
- **Responsive Design**: Works on desktop and mobile
- **Error Handling**: Graceful fallback if API is unavailable
- **Beautiful Design**: Modern gradient design with hover effects
- **Multi-Month Support**: Shows events from surrounding months

### Testing

- **Development**: Visit `http://localhost:3000/test-embed.html` or `http://localhost:3000/embed-test.html`
- **Production**: Visit `https://your-domain.com/test-embed.html` or `https://your-domain.com/embed-test.html`

The embed script will automatically detect the environment and use the correct API base URL.

## Support

For issues and questions:

- Check the troubleshooting section
- Review Facebook API documentation
- Open an issue on GitHub

---

Built with ❤️ for the [Townsville Bushwalking Club](https://townsvillebushwalkingclub.com/)

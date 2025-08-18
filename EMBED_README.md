# 🏔️ TBWC Events Embed Widget

This embed widget allows you to display upcoming Townsville Bushwalking Club events directly on your website. It's designed to be embedded on [https://townsvillebushwalkingclub.com/](https://townsvillebushwalkingclub.com/) and other websites.

## 🚀 Quick Start

### 1. Add the Container
Add this HTML where you want the events to appear:

```html
<div id="tbwc-events"></div>
```

### 2. Include the Script
Add this script tag to your HTML:

```html
<script src="https://your-vercel-deployment.vercel.app/api/embed-snippet"></script>
```

**Important:** Replace `your-vercel-deployment` with your actual Vercel deployment URL.

### 3. Complete Example
```html
<!DOCTYPE html>
<html>
<head>
    <title>Townsville Bushwalking Club</title>
</head>
<body>
    <h1>Welcome to Townsville Bushwalking Club</h1>
    
    <!-- Events will appear here -->
    <div id="tbwc-events"></div>
    
    <!-- Include the events script -->
    <script src="https://your-vercel-deployment.vercel.app/api/embed-snippet"></script>
</body>
</html>
```

## 🎨 Features

- **📅 Upcoming Events**: Shows the next 5 upcoming events
- **📱 Responsive Design**: Works perfectly on desktop and mobile
- **🎯 Automatic Updates**: Fetches latest events from your API
- **⚡ Fast Loading**: Built-in caching and optimized performance
- **🔄 Error Handling**: Graceful fallback if API is unavailable
- **🔗 Facebook Integration**: Links to your Facebook page
- **🎨 Beautiful Design**: Modern gradient design with hover effects

## ⚙️ Configuration

The widget automatically configures itself, but you can customize these settings in the script:

- **MAX_EVENTS**: Number of events to display (default: 5)
- **DAYS_AHEAD**: How many days ahead to show events (default: 90)
- **API_BASE_URL**: Your Vercel deployment URL (auto-detected)

## 🎨 Customization

### Styling
The widget comes with built-in styles, but you can customize it:

```css
/* Customize the widget appearance */
.tbwc-events-container {
    max-width: 800px; /* Make it wider */
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); /* Different colors */
}

.tbwc-event-item {
    background: rgba(255,255,255,0.2); /* More transparent */
}
```

### Colors
The widget uses a blue-purple gradient by default. You can change the colors by overriding the CSS variables.

## 📊 Data Format

The widget expects events in this format from your API:

```json
{
  "success": true,
  "data": [
    {
      "id": "event-id",
      "name": "Mountain Hike",
      "description": "Join us for a beautiful mountain hike...",
      "start_time": "2025-08-15T09:00:00.000Z",
      "formatted_date": "Friday, August 15, 2025",
      "formatted_time": "9:00 AM",
      "attending_count": 12,
      "interested_count": 25,
      "place": { "name": "Mount Stuart" }
    }
  ]
}
```

## 🔧 Technical Details

### API Endpoint
The widget fetches events from:
```
GET https://your-vercel-deployment.vercel.app/api/events/{year}/{month}
```

### CORS
The API is configured to allow cross-origin requests from any domain.

### Caching
- **Script**: Cached for 1 hour (browser), 24 hours (CDN)
- **Events**: Cached for 24 hours with stale-while-revalidate

## 🚀 Deployment

1. **Deploy to Vercel**: Push your code to GitHub and deploy to Vercel
2. **Update URL**: Replace `your-vercel-deployment` with your actual Vercel URL
3. **Test**: Verify the widget loads correctly on your website
4. **Monitor**: Check that events are updating properly

## 📱 Browser Support

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+
- ✅ Mobile browsers

## 🔍 Troubleshooting

### Widget Not Loading
- Check that the script URL is correct
- Verify the container has `id="tbwc-events"`
- Check browser console for errors

### No Events Showing
- Verify your API is returning data
- Check that events have future dates
- Ensure the API endpoint is accessible

### Styling Issues
- Check for CSS conflicts with your website
- Verify the widget styles are being injected
- Test on different screen sizes

## 📞 Support

If you need help implementing this widget:

1. Check the browser console for error messages
2. Verify your API endpoints are working
3. Test with the provided example HTML
4. Contact the TBWC team for assistance

## 🔗 Links

- **Website**: [https://townsvillebushwalkingclub.com/](https://townsvillebushwalkingclub.com/)
- **Facebook**: [https://www.facebook.com/townsvillebushwalkingclub/](https://www.facebook.com/townsvillebushwalkingclub/)
- **Instagram**: [https://www.instagram.com/townsvillebushwalkingclub/](https://www.instagram.com/townsvillebushwalkingclub/)

---

**Built with ❤️ for the Townsville Bushwalking Club**

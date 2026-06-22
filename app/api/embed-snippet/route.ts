import { NextResponse } from 'next/server'
import { ALLOWED_DOMAINS } from '@/lib/allowed-domains'
import { getFacebookEvents } from '@/lib/facebook-api'
import { OUTBOUND_REF } from '@/lib/outbound-ref'

// Cache embed for 1 hour so inlined event data stays reasonably fresh
export const revalidate = 3600

export async function GET() {
    // Convert allowed domains array to JSON for injection into the script
    const allowedDomainsJson = JSON.stringify(ALLOWED_DOMAINS)
    const outboundRefJson = JSON.stringify(OUTBOUND_REF)

    // Fetch events server-side and inline so embed shows data without a client fetch (faster first paint)
    let inlinedEventsB64 = ''
    try {
        const now = new Date()
        const minYear = 2022
        const maxFutureDate = new Date(now.getFullYear(), now.getMonth() + 3, 1)
        const allEvents = await getFacebookEvents()
        const filtered = allEvents.filter((event) => {
            if (!event.start_time) return false
            const eventDate = new Date(event.start_time)
            return (
                eventDate.getFullYear() >= minYear && eventDate < maxFutureDate
            )
        })
        inlinedEventsB64 = Buffer.from(
            JSON.stringify(filtered),
            'utf8',
        ).toString('base64')
    } catch (e) {
        console.error('Embed: failed to fetch events for inlining', e)
    }

    const snippet = `/**
 * Townsville Bushwalking Club Events Embed
 * 
 * This script can be embedded on https://townsvillebushwalkingclub.com/
 * to display upcoming events from the TBWC API
 * 
 * Usage: Add this script to your website and include a div with id="tbwc-events"
 */

(function() {
    'use strict';
    // Inlined events (base64, UTF-8) - decode bytes as UTF-8 so smart quotes etc. display correctly
    var _b64 = "${inlinedEventsB64}";
    if (_b64) {
      try {
        var _bin = atob(_b64);
        var _bytes = new Uint8Array(_bin.length);
        for (var _i = 0; _i < _bin.length; _i++) _bytes[_i] = _bin.charCodeAt(_i);
        window.__TBWC_EVENTS__ = JSON.parse(new TextDecoder('utf-8').decode(_bytes));
      } catch (e) {}
    }
    
    // Configuration
    const API_BASE_URL = (() => {
        const hostname = window.location.hostname;
        const port = window.location.port;
        const protocol = window.location.protocol;
        
        // Development environment
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            console.log('Development environment');
            return \`\${protocol}//\${hostname}:\${port}\`;
        }
        
        // Production environment - use the TBWC API endpoint
        return 'https://events.townsvillebushwalkingclub.com';
    })();
    const MAX_EVENTS = 12;
    const DAYS_AHEAD = 90; // Show events for next 90 days
    
    // CSS Styles - responsive font sizes (scale with viewport, min sizes for readability)
    const styles = \`
        .tbwc-events-container {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: clamp(16px, 1.5vw + 14px, 18px);
            max-width: 600px;
            margin: 20px auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 15px;
            color: white;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        
        .tbwc-events-header {
            text-align: center;
            margin-bottom: 20px;
        }
        
        .tbwc-events-header h3 {
            margin: 0 0 10px 0;
            font-size: clamp(1.35rem, 2vw + 1.1rem, 1.65rem);
            font-weight: bold;
        }
        
        .tbwc-events-header p {
            margin: 0;
            opacity: 0.9;
            font-size: clamp(0.95rem, 1.2vw + 0.8rem, 1.1rem);
        }
        
        .tbwc-events-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        
        .tbwc-event-item {
            background: rgba(255,255,255,0.1);
            margin-bottom: 15px;
            padding: 15px;
            border-radius: 10px;
            border-left: 4px solid #4facfe;
            transition: all 0.3s ease;
        }
        
        .tbwc-event-item:hover {
            background: rgba(255,255,255,0.15);
            transform: translateY(-2px);
        }
        
        .tbwc-event-content {
            display: flex;
            gap: 15px;
            align-items: flex-start;
        }
        
        .tbwc-event-thumbnail {
            shrink: 0;
            width: 80px;
            height: 80px;
            border-radius: 8px;
            overflow: hidden;
            background: rgba(255,255,255,0.1);
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .tbwc-event-thumbnail img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .tbwc-event-thumbnail-placeholder {
            color: rgba(255,255,255,0.6);
            font-size: 2rem;
        }
        
        .tbwc-event-details {
            flex: 1;
            min-width: 0;
            overflow: hidden;
        }
        
        .tbwc-event-title {
            font-weight: bold;
            font-size: clamp(1.1rem, 1.5vw + 0.95rem, 1.3rem);
            margin-bottom: 8px;
        }
        
        .tbwc-event-date {
            color: #4facfe;
            font-weight: 600;
            font-size: clamp(1rem, 1.2vw + 0.85rem, 1.15rem);
            margin-bottom: 5px;
        }
        
        .tbwc-event-time {
            opacity: 0.9;
            font-size: clamp(0.95rem, 1.1vw + 0.8rem, 1.05rem);
            margin-bottom: 8px;
        }
         
        .tbwc-event-end-date {
            color: #4facfe;
            font-weight: 600;
            font-size: clamp(0.95rem, 1.1vw + 0.8rem, 1.05rem);
            margin-bottom: 8px;
        }
         
        .tbwc-event-location {
            font-style: italic;
            opacity: 0.8;
            font-size: clamp(0.95rem, 1.1vw + 0.8rem, 1.05rem);
            margin-bottom: 10px;
        }
        
        .tbwc-event-description {
            opacity: 0.9;
            font-size: clamp(1rem, 1.2vw + 0.85rem, 1.1rem);
            line-height: 1.5;
            margin-bottom: 10px;
            max-height: 5.5em;
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        
        .tbwc-event-description a {
            color: #4facfe;
            text-decoration: underline;
            word-break: break-all;
            display: inline;
        }
        
        .tbwc-event-description a:hover {
            text-decoration: none;
        }
        
        .tbwc-event-description.expanded {
            max-height: none;
            -webkit-line-clamp: unset;
            white-space: pre-wrap;
            word-wrap: break-word;
            overflow: visible;
        }
        
        .tbwc-event-description-toggle {
            color: #4facfe;
            cursor: pointer;
            font-size: clamp(0.9rem, 1vw + 0.8rem, 1rem);
            text-decoration: underline;
            margin-bottom: 10px;
            display: inline-block;
            position: relative;
            z-index: 2;
            clear: both;
        }
        
        .tbwc-event-stats {
            display: flex;
            gap: 15px;
            margin-top: 10px;
            font-size: clamp(0.9rem, 1vw + 0.8rem, 1rem);
            opacity: 0.85;
            clear: both;
            position: relative;
            z-index: 1;
        }
        
        .tbwc-event-links {
            margin-top: 10px;
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            align-items: center;
        }

        .tbwc-event-view-btn {
            display: inline-block;
            background: rgba(255,255,255,0.25);
            color: white;
            text-decoration: none;
            font-size: clamp(0.9rem, 1vw + 0.75rem, 1rem);
            font-weight: 600;
            padding: 8px 14px;
            border-radius: 8px;
            border: 1px solid rgba(255,255,255,0.4);
            transition: background 0.2s, border-color 0.2s;
        }

        .tbwc-event-view-btn:hover {
            background: rgba(255,255,255,0.35);
            border-color: rgba(255,255,255,0.6);
            color: white;
        }

        .tbwc-event-fb-link {
            color: #4facfe;
            text-decoration: none;
            font-size: clamp(0.95rem, 1.1vw + 0.8rem, 1.05rem);
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            gap: 5px;
        }

        .tbwc-event-fb-link:hover {
            text-decoration: underline;
        }
        
        @media (min-width: 600px) {
            .tbwc-events-container {
                font-size: 18px;
                padding: 24px;
            }
            .tbwc-event-item {
                padding: 18px;
            }
            .tbwc-event-description {
                max-height: 6em;
            }
        }
        
        .tbwc-loading {
            text-align: center;
            padding: 20px;
        }
        
        .tbwc-loading::after {
            content: '';
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 2px solid rgba(255,255,255,0.3);
            border-radius: 50%;
            border-top-color: white;
            animation: tbwc-spin 1s ease-in-out infinite;
        }
        
        @keyframes tbwc-spin {
            to { transform: rotate(360deg); }
        }
        
        .tbwc-error {
            background: rgba(255,255,255,0.1);
            padding: 15px;
            border-radius: 10px;
            text-align: center;
            border-left: 4px solid #ff6b6b;
        }
        
        .tbwc-no-events {
            text-align: center;
            padding: 20px;
            opacity: 0.8;
        }
        
        .tbwc-view-all {
            text-align: center;
            margin-top: 20px;
        }
        
        .tbwc-view-all a {
            color: white;
            text-decoration: none;
            padding: 10px 20px;
            background: rgba(255,255,255,0.2);
            border-radius: 25px;
            transition: all 0.3s ease;
            display: inline-block;
        }
        
        .tbwc-view-all a:hover {
            background: rgba(255,255,255,0.3);
            transform: translateY(-2px);
        }
    \`;
    
    // Inject styles
    function injectStyles() {
        if (!document.getElementById('tbwc-events-styles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'tbwc-events-styles';
            styleSheet.textContent = styles;
            document.head.appendChild(styleSheet);
        }
    }
    
    // Get current month and year
    function getCurrentMonthYear() {
        const now = new Date();
        return {
            year: now.getFullYear(),
            month: now.getMonth() + 1
        };
    }
    
    // Fetch all events in one API call (avoids 4x /api/events/year/month and reduces Facebook API load)
    async function fetchAllEvents() {
        try {
            const url = \`\${API_BASE_URL}/api/events\`;
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                if (data.success && Array.isArray(data.data)) {
                    return data.data;
                }
            }
        } catch (error) {
            console.error('TBWC Events: Error fetching events:', error);
        }
        return [];
    }
    
    // Filter upcoming events
    function filterUpcomingEvents(events) {
        const now = new Date();
        const futureDate = new Date();
        futureDate.setDate(now.getDate() + DAYS_AHEAD);
        
        return events
            .filter(event => {
                const eventDate = new Date(event.start_time);
                return eventDate >= now && eventDate <= futureDate;
            })
            .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
            .slice(0, MAX_EVENTS);
    }
    
  // Process description to add hyperlinks for emails, phone numbers, and URLs
    function toTelHref(phone) {
        const compact = phone.replace(/[\\s.-]/g, '');
        if (compact.startsWith('+61')) {
            return 'tel:' + compact;
        }
        if (compact.startsWith('61') && compact.length === 11) {
            return 'tel:+' + compact;
        }
        if (compact.startsWith('0')) {
            return 'tel:' + compact;
        }
        if (compact.startsWith('4') && compact.length === 9) {
            return 'tel:0' + compact;
        }
        return 'tel:' + compact;
    }

    function tagOutboundRef(href) {
        try {
            const url = new URL(href);
            if (url.protocol !== 'http:' && url.protocol !== 'https:') {
                return href;
            }
            if (url.hostname.toLowerCase() === ${outboundRefJson}) {
                return href;
            }
            if (url.searchParams.has('ref')) {
                return href;
            }
            url.searchParams.set('ref', ${outboundRefJson});
            return url.toString();
        } catch (e) {
            return href;
        }
    }

    function buildMailtoSubject(eventTitle, startTime) {
        if (!eventTitle) return '';
        if (startTime) {
            try {
                const date = new Date(startTime);
                if (!isNaN(date.getTime())) {
                    const datePart = date.toLocaleDateString('en-AU', {
                        day: 'numeric',
                        month: 'long',
                        timeZone: 'Australia/Brisbane',
                    });
                    return 'Re: ' + datePart + ' - ' + eventTitle;
                }
            } catch (e) {}
        }
        return 'Re: ' + eventTitle;
    }

    function processDescription(description, eventTitle, eventStartTime) {
        if (!description) return '';
        
        // First, escape any existing HTML to prevent conflicts
        let processed = description
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
        
        // Convert emails to mailto: links with event title as subject
        processed = processed.replace(
            /\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b/g,
            function(match) {
                const subjectText = buildMailtoSubject(eventTitle, eventStartTime);
                const subject = subjectText ? encodeURIComponent(subjectText) : '';
                const mailtoLink = subject ? 'mailto:' + match + '?subject=' + subject : 'mailto:' + match;
                return '<a href="' + mailtoLink + '" style="color: #4facfe; text-decoration: underline;">' + match + '</a>';
            }
        );

        // Convert Australian mobile numbers to tel: links
        processed = processed.replace(
            /(?<![\\d+])(?:\\+61[\\s.-]?4(?:[\\s.-]?\\d){8}|0?4(?:[\\s.-]?\\d){2}(?:[\\s.-]?\\d){3}(?:[\\s.-]?\\d){3}|0?4\\d{8})(?![\\d])/g,
            function(match) {
                return '<a href="' + toTelHref(match) + '" style="color: #4facfe; text-decoration: underline;">' + match + '</a>';
            }
        );
        
        // Convert bracketed domains to clickable links (only from allowed domains)
        processed = processed.replace(
            /\\(([A-Za-z0-9][A-Za-z0-9.-]*\\.[A-Z|a-z]{2,})\\)/g,
            function(match, domain) {
                try {
                    // Normalize domain (remove www. prefix for comparison, but keep it in the link)
                    const normalizedDomain = domain.toLowerCase().replace(/^www\\./, '');
                    const fullDomain = domain.toLowerCase();
                    
                    // Check if the domain (with or without www) is in the allowed domains list
                    const allowedDomains = ${allowedDomainsJson};
                    const isAllowed = allowedDomains.some(domain => {
                        const normalizedAllowed = domain.toLowerCase();
                        return fullDomain === normalizedAllowed || 
                               fullDomain === 'www.' + normalizedAllowed ||
                               fullDomain.endsWith('.' + normalizedAllowed);
                    });
                    
                    if (isAllowed) {
                        // Create the full URL
                        const url = tagOutboundRef('https://' + fullDomain);
                        return '(<a href="' + url + '" target="_blank" style="color: #4facfe; text-decoration: underline;">' + domain + '</a>)';
                    } else {
                        // Return as-is if not allowed
                        return match;
                    }
                } catch (e) {
                    // If parsing fails, return as-is
                    return match;
                }
            }
        );
        
        // Convert URLs to clickable links (only from allowed domains)
        processed = processed.replace(
            /(https?:\\/\\/[^\\s]+)/g,
            function(match) {
                // Check if URL is from allowed domains
                const allowedDomains = ${allowedDomainsJson};
                
                try {
                    const url = new URL(match);
                    const hostname = url.hostname.toLowerCase();
                    
                    // Check if the hostname matches any of the allowed domains
                    const isAllowed = allowedDomains.some(domain => 
                        hostname === domain || hostname.endsWith('.' + domain)
                    );
                    
                    if (isAllowed) {
                        const tagged = tagOutboundRef(match);
                        return '<a href="' + tagged + '" target="_blank" style="color: #4facfe; text-decoration: underline;">' + match + '</a>';
                    } else {
                        // Return the URL as plain text if not allowed
                        return match;
                    }
                } catch (e) {
                    // If URL parsing fails, return as plain text
                    return match;
                }
            }
        );
        
        return processed;
    }
    
    // Truncate description
    function truncateDescription(description, maxLength = 150) {
        if (!description || description.length <= maxLength) {
            return description;
        }
        return description.substring(0, maxLength) + '...';
    }
    
    // Create event HTML
    function createEventHTML(event) {
        const hasLongDescription = event.description && event.description.length > 150;
        const truncatedDesc = hasLongDescription ? truncateDescription(event.description) : event.description;
        const processedTruncatedDesc = processDescription(truncatedDesc, event.name, event.start_time);
        const eventPageUrl = \`\${API_BASE_URL}/events/\${event.id}\`;
        const facebookEventUrl = \`https://www.facebook.com/events/\${event.id}/\`;
        let coverImageUrl = event.cover && event.cover.source ? event.cover.source : null;
        
        // Convert relative image paths to absolute URLs
        if (coverImageUrl && coverImageUrl.startsWith('/')) {
            coverImageUrl = \`\${API_BASE_URL}\${coverImageUrl}\`;
        }
        
        // Check which month the event is from
        const eventDate = new Date(event.start_time);
        const currentMonth = new Date().getMonth();
        const eventMonth = eventDate.getMonth();
        const currentYear = new Date().getFullYear();
        const eventYear = eventDate.getFullYear();
        
        // Calculate month difference
        const monthDiff = (eventYear - currentYear) * 12 + (eventMonth - currentMonth);
        let monthLabel = '';
        
        if (monthDiff === 1) {
            monthLabel = 'Next Month';
        } else if (monthDiff === 2) {
            monthLabel = 'Month After Next';
        }
        
        // Debug logging
        console.log('Event:', event.name, 'Cover:', event.cover, 'Cover URL:', coverImageUrl);
        console.log('Event end date:', event.formatted_end_date, 'End time:', event.formatted_end_time);
        
        // Determine date/time display logic
        let dateTimeDisplay = '';
        
        if (!event.formatted_end_date) {
            // No end date - show start date and time only
            dateTimeDisplay = \`
                <div class="tbwc-event-date">\${event.formatted_date}</div>
                <div class="tbwc-event-time">🕐 \${event.formatted_time}</div>
            \`;
        } else if (event.formatted_end_date === event.formatted_date) {
            // Same date - show start date and both times
            dateTimeDisplay = \`
                <div class="tbwc-event-date">\${event.formatted_date}</div>
                <div class="tbwc-event-time">🕐 \${event.formatted_time}\${event.formatted_end_time ? \` - \${event.formatted_end_time}\` : ''}</div>
            \`;
        } else {
            // Different dates - show multi-day format
            dateTimeDisplay = \`
                <div class="tbwc-event-date">\${event.formatted_date} to \${event.formatted_end_date}</div>
                <div class="tbwc-event-time">🕐 \${new Date(event.end_time).toLocaleDateString(undefined, { weekday: 'long', })} \${event.formatted_time} - \${new Date(event.start_time).toLocaleDateString(undefined, { weekday: 'long', })} \${event.formatted_end_time || ''}</div>
            \`;
        }
        
        return \`
            <li class="tbwc-event-item" data-start-time="\${event.start_time}">
                <div class="tbwc-event-content">
                    <div class="tbwc-event-thumbnail">
                        \${coverImageUrl ? \`<img src="\${coverImageUrl}" alt="\${event.name}">\` : \`<div class="tbwc-event-thumbnail-placeholder">🏔️</div>\`}
                    </div>
                    <div class="tbwc-event-details">
                        <div class="tbwc-event-title">
                            \${event.name}
                            \${monthLabel ? \`<span style="background: rgba(255,255,255,0.2); color: white; font-size: 0.7rem; padding: 2px 6px; border-radius: 10px; margin-left: 8px;">\${monthLabel}</span>\` : ''}
                        </div>
                        \${dateTimeDisplay}
                        \${event.place ? \`<div class="tbwc-event-location">📍 \${event.place.name}</div>\` : ''}
                        \${event.description ? \`
                            <div class="tbwc-event-description" id="desc-\${event.id}">\${processedTruncatedDesc}</div>
                            \${hasLongDescription ? \`<div class="tbwc-event-description-toggle" onclick="toggleDescription('\${event.id}')">Read more</div>\` : ''}
                        \` : ''}
                        <div class="tbwc-event-stats">
                            <span>👥 \${event.attending_count} attending</span>
                            <span>❤️ \${event.interested_count} interested</span>
                        </div>
                        <div class="tbwc-event-links">
                            <a href="\${eventPageUrl}" target="_blank" rel="noopener noreferrer" class="tbwc-event-view-btn">View Event</a>
                            <a href="\${facebookEventUrl}" target="_blank" rel="noopener noreferrer" class="tbwc-event-fb-link">📘 View on Facebook →</a>
                        </div>
                    </div>
                </div>
            </li>
        \`;
    }
    
    // Toggle description expansion
    window.toggleDescription = function(eventId) {
        const descElement = document.getElementById(\`desc-\${eventId}\`);
        const toggleElement = descElement.nextElementSibling;
        
        if (descElement.classList.contains('expanded')) {
            descElement.classList.remove('expanded');
            const fullText = descElement.getAttribute('data-full-text');
            if (fullText) {
                const truncatedText = truncateDescription(fullText);
                // Get event name from the parent event item
                const eventItem = descElement.closest('.tbwc-event-item');
                const eventTitle = eventItem ? eventItem.querySelector('.tbwc-event-title').textContent.trim() : '';
                const eventStartTime = eventItem ? eventItem.getAttribute('data-start-time') : '';
                descElement.innerHTML = processDescription(truncatedText, eventTitle, eventStartTime);
            }
            toggleElement.textContent = 'Read more';
        } else {
            const fullText = descElement.getAttribute('data-full-text');
            if (fullText) {
                descElement.classList.add('expanded');
                // Get event name from the parent event item
                const eventItem = descElement.closest('.tbwc-event-item');
                const eventTitle = eventItem ? eventItem.querySelector('.tbwc-event-title').textContent.trim() : '';
                const eventStartTime = eventItem ? eventItem.getAttribute('data-start-time') : '';
                descElement.innerHTML = processDescription(fullText, eventTitle, eventStartTime);
            }
            toggleElement.textContent = 'Read less';
        }
        
        // Force a reflow to ensure proper layout
        descElement.offsetHeight;
        
        // Ensure the toggle element stays in the right place
        if (toggleElement && toggleElement.classList.contains('tbwc-event-description-toggle')) {
            toggleElement.style.display = 'inline-block';
            toggleElement.style.marginTop = '5px';
        }
    };
    
    // Initialize container with header and empty list
    function initializeContainer(container) {
        container.innerHTML = \`
            <div class="tbwc-events-header">
                <h3>🏔️ Upcoming Events</h3>
                <p>Join us for our next bushwalking adventures</p>
            </div>
            <ul class="tbwc-events-list" id="tbwc-events-list">
                <li class="tbwc-loading">
                    <p>Loading events...</p>
                </li>
            </ul>
            <div class="tbwc-view-all">
                <a href="https://www.facebook.com/townsvillebushwalkingclub/" target="_blank">
                    View All Events on Facebook →
                </a>
            </div>
        \`;
    }
    
    // Update the events list (clears and re-renders to maintain sort order)
    function updateEventsList(events) {
        const eventsList = document.getElementById('tbwc-events-list');
        if (!eventsList) return;
        
        // Clear the list
        eventsList.innerHTML = '';
        
        // Create and append all event items
        events.forEach(event => {
            const eventHTML = createEventHTML(event);
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = eventHTML;
            const eventElement = tempDiv.firstElementChild;
            eventsList.appendChild(eventElement);
            
            // Store full description for toggle functionality
            if (event.description) {
                const descElement = document.getElementById(\`desc-\${event.id}\`);
                if (descElement) {
                    descElement.setAttribute('data-full-text', event.description);
                }
            }
        });
    }
    
    // Show "no events" message
    function showNoEvents(container) {
        const eventsList = document.getElementById('tbwc-events-list');
        if (eventsList) {
            eventsList.innerHTML = \`
                <div class="tbwc-no-events">
                    <p>No upcoming events scheduled at the moment.</p>
                    <p>Check back soon or visit our Facebook page for updates!</p>
                </div>
            \`;
        }
    }
    
    // Render events (for backwards compatibility)
    function renderEvents(container, events) {
        if (events.length === 0) {
            container.innerHTML = \`
                <div class="tbwc-no-events">
                    <p>No upcoming events scheduled at the moment.</p>
                    <p>Check back soon or visit our Facebook page for updates!</p>
                </div>
            \`;
            return;
        }
        
        const eventsHTML = events.map(createEventHTML).join('');
        container.innerHTML = \`
            <div class="tbwc-events-header">
                <h3>🏔️ Upcoming Events</h3>
                <p>Join us for our next bushwalking adventures</p>
            </div>
            <ul class="tbwc-events-list">
                \${eventsHTML}
            </ul>
            <div class="tbwc-view-all">
                <a href="https://www.facebook.com/townsvillebushwalkingclub/" target="_blank">
                    View All Events on Facebook →
                </a>
            </div>
        \`;
        
        // Store full descriptions for toggle functionality
        events.forEach(event => {
            if (event.description) {
                const descElement = document.getElementById(\`desc-\${event.id}\`);
                if (descElement) {
                    // Store the original description text (without HTML) for toggling
                    descElement.setAttribute('data-full-text', event.description);
                }
            }
        });
    }
    
    // Show error
    function showError(container, message) {
        container.innerHTML = \`
            <div class="tbwc-error">
                <p>Unable to load events at the moment.</p>
                <p>Please visit our <a href="https://www.facebook.com/townsvillebushwalkingclub/" target="_blank" style="color: #4facfe;">Facebook page</a> for the latest updates.</p>
            </div>
        \`;
    }
    
    // Show loading
    function showLoading(container) {
        container.innerHTML = \`
            <div class="tbwc-loading">
                <p>Loading upcoming events...</p>
            </div>
        \`;
    }
    
    // Main function
    async function init() {
        // Inject styles
        injectStyles();
        
        // Find container
        const container = document.getElementById('tbwc-events');
        if (!container) {
            console.warn('TBWC Events: Container with id="tbwc-events" not found');
            return;
        }
        
        // Initialize container with header and loading indicator
        initializeContainer(container);
        
        // Preconnect to API origin so any fallback fetch or images load faster
        try {
            var _origin = (typeof API_BASE_URL === 'string') ? new URL(API_BASE_URL).origin : '';
            if (_origin && !document.querySelector('link[rel="preconnect"][href="' + _origin + '"]')) {
                var _link = document.createElement('link');
                _link.rel = 'preconnect';
                _link.href = _origin;
                document.head.appendChild(_link);
            }
        } catch (e) {}
        
        try {
            // Use inlined events if available (no client fetch), else fetch from API
            var allEvents = window.__TBWC_EVENTS__ && Array.isArray(window.__TBWC_EVENTS__) ? window.__TBWC_EVENTS__ : await fetchAllEvents();
            var upcomingEvents = filterUpcomingEvents(allEvents);
            
            if (upcomingEvents.length === 0) {
                showNoEvents(container);
            } else {
                updateEventsList(upcomingEvents);
            }
            
            console.log('Total events:', allEvents.length, 'Upcoming displayed:', upcomingEvents.length);
        } catch (error) {
            console.error('TBWC Events Error:', error);
            showError(container, 'Failed to load events. Please check the console for details.');
        }
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();`

    return new NextResponse(snippet, {
        headers: {
            'Content-Type': 'application/javascript; charset=utf-8',
            'Cache-Control':
                'public, max-age=3600, s-maxage=3600, stale-while-revalidate=3600', // 1 hour (matches inlined event data freshness)
        },
    })
}

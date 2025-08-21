import { NextResponse } from 'next/server'

export async function GET() {
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
    
    // Configuration
    const API_BASE_URL = (() => {
        const hostname = window.location.hostname;
        const port = window.location.port;
        const protocol = window.location.protocol;
        
        // Development environment
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return \`\${protocol}//\${hostname}:\${port}\`;
        }
        
        // Production environment - use the TBWC API endpoint
        return 'http://tbwc.wanderstories.space';
    })();
    const MAX_EVENTS = 12;
    const DAYS_AHEAD = 365; // Show events for next 365 days
    
    // CSS Styles
    const styles = \`
        .tbwc-events-container {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
            font-size: 1.5rem;
            font-weight: bold;
        }
        
        .tbwc-events-header p {
            margin: 0;
            opacity: 0.9;
            font-size: 0.9rem;
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
            flex-shrink: 0;
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
        }
        
        .tbwc-event-title {
            font-weight: bold;
            font-size: 1.1rem;
            margin-bottom: 8px;
        }
        
        .tbwc-event-date {
            color: #4facfe;
            font-weight: 600;
            margin-bottom: 5px;
        }
        
                 .tbwc-event-time {
             opacity: 0.9;
             font-size: 0.9rem;
             margin-bottom: 8px;
         }
         
         .tbwc-event-end-date {
             color: #4facfe;
             font-weight: 600;
             font-size: 0.9rem;
             margin-bottom: 8px;
         }
         
         .tbwc-event-location {
             font-style: italic;
             opacity: 0.8;
             font-size: 0.9rem;
             margin-bottom: 10px;
         }
        
        .tbwc-event-description {
            opacity: 0.9;
            font-size: 0.9rem;
            line-height: 1.4;
            margin-bottom: 10px;
            max-height: 80px;
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            white-space: pre-wrap;
        }
        
        .tbwc-event-description.expanded {
            max-height: none;
            -webkit-line-clamp: unset;
            white-space: pre-wrap;
        }
        
        .tbwc-event-description-toggle {
            color: #4facfe;
            cursor: pointer;
            font-size: 0.8rem;
            text-decoration: underline;
            margin-bottom: 10px;
            display: inline-block;
        }
        
        .tbwc-event-stats {
            display: flex;
            gap: 15px;
            margin-top: 10px;
            font-size: 0.8rem;
            opacity: 0.7;
        }
        
        .tbwc-event-link {
            margin-top: 10px;
        }
        
        .tbwc-event-link a {
            color: #4facfe;
            text-decoration: none;
            font-size: 0.9rem;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            gap: 5px;
        }
        
        .tbwc-event-link a:hover {
            text-decoration: underline;
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
    
    // Fetch events from API
    async function fetchEvents() {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        
        // Fetch events from previous month, current month, and next two months
        const monthsToFetch = [];
        
        // Previous month
        const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
        const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
        monthsToFetch.push({ year: prevYear, month: prevMonth });
        
        // Current month
        monthsToFetch.push({ year: currentYear, month: currentMonth });
        
        // Next month
        const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
        const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;
        monthsToFetch.push({ year: nextYear, month: nextMonth });
        
        // Month after next
        const monthAfterNext = nextMonth === 12 ? 1 : nextMonth + 1;
        const yearAfterNext = nextMonth === 12 ? nextYear + 1 : nextYear;
        monthsToFetch.push({ year: yearAfterNext, month: monthAfterNext });

        let allEvents = [];
        
        for (const { year, month } of monthsToFetch) {
            try {
                const url = \`\${API_BASE_URL}/api/events/\${year}/\${month}\`;
                console.log(\`Fetching events from: \${url}\`);
                const response = await fetch(url);
                
                if (response.ok) {
                    const data = await response.json();
                    console.log(\`Events for \${year}/\${month}:\`, data.success ? data.data.length : 'Failed');
                    if (data.success && data.data) {
                        allEvents = allEvents.concat(data.data);
                    }
                } else {
                    console.error(\`Failed to fetch events for \${year}/\${month}: \${response.status}\`);
                }
            } catch (error) {
                console.error(\`Error fetching events for \${year}/\${month}:\`, error);
            }
        }
        
        return allEvents;
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
    
    // Truncate description
    function truncateDescription(description, maxLength = 150) {
        if (!description || description.length <= maxLength) {
            return description;
        }
        return description.substring(0, maxLength) + '...';
    }
    
    // Create event HTML
    function createEventHTML(event) {
        const truncatedDesc = truncateDescription(event.description);
        const hasLongDescription = event.description && event.description.length > 150;
        const facebookEventUrl = \`https://www.facebook.com/events/\${event.id}/\`;
        const coverImageUrl = event.cover && event.cover.source ? event.cover.source : null;
        
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
        
        return \`
            <li class="tbwc-event-item">
                <div class="tbwc-event-content">
                    <div class="tbwc-event-thumbnail">
                        \${coverImageUrl ? \`<img src="\${coverImageUrl}" alt="\${event.name}">\` : \`<div class="tbwc-event-thumbnail-placeholder">🏔️</div>\`}
                    </div>
                    <div class="tbwc-event-details">
                        <div class="tbwc-event-title">
                            \${event.name}
                            \${monthLabel ? \`<span style="background: rgba(255,255,255,0.2); color: white; font-size: 0.7rem; padding: 2px 6px; border-radius: 10px; margin-left: 8px;">\${monthLabel}</span>\` : ''}
                        </div>
                        <div class="tbwc-event-date">\${event.formatted_date}</div>
                        <div class="tbwc-event-time">🕐 \${event.formatted_time}\${event.formatted_end_time ? \` - \${event.formatted_end_time}\` : ''}</div>
                        \${event.formatted_end_date ? \`<div class="tbwc-event-end-date">📅 Ends: \${event.formatted_end_date}</div>\` : ''}
                        \${event.place ? \`<div class="tbwc-event-location">📍 \${event.place.name}</div>\` : ''}
                        \${event.description ? \`
                            <div class="tbwc-event-description" id="desc-\${event.id}">\${truncatedDesc}</div>
                            \${hasLongDescription ? \`<div class="tbwc-event-description-toggle" onclick="toggleDescription('\${event.id}')">Read more</div>\` : ''}
                        \` : ''}
                        <div class="tbwc-event-stats">
                            <span>👥 \${event.attending_count} attending</span>
                            <span>❤️ \${event.interested_count} interested</span>
                        </div>
                        <div class="tbwc-event-link">
                            <a href="\${facebookEventUrl}" target="_blank">
                                📘 View on Facebook →
                            </a>
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
            descElement.textContent = truncateDescription(descElement.getAttribute('data-full-text'));
            toggleElement.textContent = 'Read more';
        } else {
            const fullText = descElement.getAttribute('data-full-text') || descElement.textContent;
            descElement.setAttribute('data-full-text', fullText);
            descElement.classList.add('expanded');
            descElement.textContent = fullText;
            toggleElement.textContent = 'Read less';
        }
    };
    
    // Render events
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
                <p>Join us for our next bushwalking adventures (Surrounding Months)</p>
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
        
        // Show loading
        showLoading(container);
        
        try {
            // Fetch events
            const events = await fetchEvents();
            console.log('Total events fetched:', events.length);
            
            // Filter upcoming events
            const upcomingEvents = filterUpcomingEvents(events);
            console.log('Upcoming events after filtering:', upcomingEvents.length);
            console.log('Upcoming events:', upcomingEvents.map(e => ({ name: e.name, date: e.formatted_date })));
            
            // Render events
            renderEvents(container, upcomingEvents);
            
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
            'Content-Type': 'application/javascript',
            'Cache-Control': 'public, max-age=300, s-maxage=3600', // Reduced cache time for testing
        },
    })
}

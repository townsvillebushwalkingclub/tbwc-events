/**
 * Townsville Bushwalking Club Events Embed
 *
 * This script can be embedded on https://townsvillebushwalkingclub.com/
 * to display upcoming events from the TBWC API
 *
 * Usage: Add this script to your website and include a div with id="tbwc-events"
 */

;(function () {
    'use strict'

    // Configuration
    const API_BASE_URL = 'https://tbwc.vercel.app'
    const MAX_EVENTS = 5
    const DAYS_AHEAD = 90 // Show events for next 90 days

    // CSS Styles
    const styles = `
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
        
        .tbwc-event-location {
            font-style: italic;
            opacity: 0.8;
            font-size: 0.9rem;
        }
        
        .tbwc-event-stats {
            display: flex;
            gap: 15px;
            margin-top: 10px;
            font-size: 0.8rem;
            opacity: 0.7;
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
    `

    // Inject styles
    function injectStyles() {
        if (!document.getElementById('tbwc-events-styles')) {
            const styleSheet = document.createElement('style')
            styleSheet.id = 'tbwc-events-styles'
            styleSheet.textContent = styles
            document.head.appendChild(styleSheet)
        }
    }

    // Format date
    function formatDate(dateString) {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-AU', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'Australia/Brisbane',
        })
    }

    // Get current month and year
    function getCurrentMonthYear() {
        const now = new Date()
        return {
            year: now.getFullYear(),
            month: now.getMonth() + 1,
        }
    }

    // Fetch events from API
    async function fetchEvents() {
        const { year, month } = getCurrentMonthYear()
        const url = `${API_BASE_URL}/api/events/${year}/${month}`

        try {
            const response = await fetch(url)
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }
            const data = await response.json()
            return data.success ? data.data : []
        } catch (error) {
            console.error('Error fetching TBWC events:', error)
            return []
        }
    }

    // Filter upcoming events
    function filterUpcomingEvents(events) {
        const now = new Date()
        const futureDate = new Date()
        futureDate.setDate(now.getDate() + DAYS_AHEAD)

        return events
            .filter((event) => {
                const eventDate = new Date(event.start_time)
                return eventDate >= now && eventDate <= futureDate
            })
            .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
            .slice(0, MAX_EVENTS)
    }

    // Create event HTML
    function createEventHTML(event) {
        return `
            <li class="tbwc-event-item">
                <div class="tbwc-event-title">${event.name}</div>
                <div class="tbwc-event-date">${event.formatted_date}</div>
                <div class="tbwc-event-time">🕐 ${event.formatted_time}</div>
                ${
                    event.place
                        ? `<div class="tbwc-event-location">📍 ${event.place.name}</div>`
                        : ''
                }
                <div class="tbwc-event-stats">
                    <span>👥 ${event.attending_count} attending</span>
                    <span>❤️ ${event.interested_count} interested</span>
                </div>
            </li>
        `
    }

    // Render events
    function renderEvents(container, events) {
        if (events.length === 0) {
            container.innerHTML = `
                <div class="tbwc-no-events">
                    <p>No upcoming events scheduled at the moment.</p>
                    <p>Check back soon or visit our Facebook page for updates!</p>
                </div>
            `
            return
        }

        const eventsHTML = events.map(createEventHTML).join('')
        container.innerHTML = `
            <div class="tbwc-events-header">
                <h3>🏔️ Upcoming Events</h3>
                <p>Join us for our next bushwalking adventures</p>
            </div>
            <ul class="tbwc-events-list">
                ${eventsHTML}
            </ul>
            <div class="tbwc-view-all">
                <a href="https://www.facebook.com/townsvillebushwalkingclub/" target="_blank">
                    View All Events on Facebook →
                </a>
            </div>
        `
    }

    // Show error
    function showError(container, message) {
        container.innerHTML = `
            <div class="tbwc-error">
                <p>Unable to load events at the moment.</p>
                <p>Please visit our <a href="https://www.facebook.com/townsvillebushwalkingclub/" target="_blank" style="color: #4facfe;">Facebook page</a> for the latest updates.</p>
            </div>
        `
    }

    // Show loading
    function showLoading(container) {
        container.innerHTML = `
            <div class="tbwc-loading">
                <p>Loading upcoming events...</p>
            </div>
        `
    }

    // Main function
    async function init() {
        // Inject styles
        injectStyles()

        // Find container
        const container = document.getElementById('tbwc-events')
        if (!container) {
            console.warn(
                'TBWC Events: Container with id="tbwc-events" not found'
            )
            return
        }

        // Show loading
        showLoading(container)

        try {
            // Fetch events
            const events = await fetchEvents()

            // Filter upcoming events
            const upcomingEvents = filterUpcomingEvents(events)

            // Render events
            renderEvents(container, upcomingEvents)
        } catch (error) {
            console.error('TBWC Events Error:', error)
            showError(container, error.message)
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init)
    } else {
        init()
    }
})()

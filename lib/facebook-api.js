/**
 * Facebook Graph API integration for Townsville Bushwalking Club
 * Fetches events from the TBWC Facebook page
 */

// Try to get the page ID from environment, fallback to username
const FACEBOOK_PAGE_ID =
    process.env.FACEBOOK_PAGE_ID || 'townsvillebcushwalkingclub'
const FACEBOOK_ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN

// Load environment variables if not in Next.js
if (typeof window === 'undefined' && !process.env.FACEBOOK_ACCESS_TOKEN) {
    try {
        require('dotenv').config()
    } catch (error) {
        console.warn(
            'dotenv not available, using existing environment variables'
        )
    }
}

/**
 * Fetch page information from Facebook Graph API
 */
async function getPageInfo() {
    if (!FACEBOOK_ACCESS_TOKEN) {
        throw new Error('Facebook access token is required')
    }

    const url = `https://graph.facebook.com/v19.0/${FACEBOOK_PAGE_ID}?access_token=${FACEBOOK_ACCESS_TOKEN}&fields=id,name,about,fan_count`

    try {
        console.log(
            'Fetching page info from:',
            url.replace(FACEBOOK_ACCESS_TOKEN, '[TOKEN]')
        )
        const response = await fetch(url)

        if (!response.ok) {
            const errorText = await response.text()
            console.error('Facebook API error response:', errorText)
            throw new Error(
                `Failed to fetch page info: ${response.status} ${response.statusText}`
            )
        }

        const data = await response.json()
        console.log('Page info response:', data)
        return data
    } catch (error) {
        console.error('Error fetching page info:', error)
        throw error
    }
}

/**
 * Fetch events from Facebook Graph API
 */
async function getFacebookEvents() {
    if (!FACEBOOK_ACCESS_TOKEN) {
        throw new Error('Facebook access token is required')
    }

    const url = `https://graph.facebook.com/v19.0/${FACEBOOK_PAGE_ID}/events?access_token=${FACEBOOK_ACCESS_TOKEN}&fields=id,name,description,start_time,end_time,place,attending_count,interested_count,cover&limit=50&time_filter=upcoming`

    try {
        console.log(
            'Fetching events from:',
            url.replace(FACEBOOK_ACCESS_TOKEN, '[TOKEN]')
        )
        const response = await fetch(url)

        if (!response.ok) {
            const errorText = await response.text()
            console.error('Facebook API error response:', errorText)
            throw new Error(
                `Failed to fetch events: ${response.status} ${response.statusText}`
            )
        }

        const data = await response.json()
        console.log('Events response:', data)

        if (!data.data) {
            console.warn('No events data returned from Facebook API')
            return []
        }

        // Format events for our application
        const formattedEvents = data.data.map((event) => ({
            id: event.id,
            name: event.name,
            description: event.description || '',
            start_time: event.start_time,
            end_time: event.end_time,
            formatted_date: formatEventDate(event.start_time),
            formatted_time: formatEventTime(event.start_time),
            attending_count: event.attending_count || 0,
            interested_count: event.interested_count || 0,
            place: event.place || null,
            cover: event.cover || null,
        }))

        return formattedEvents
    } catch (error) {
        console.error('Error fetching Facebook events:', error)
        throw error
    }
}

/**
 * Format event date for display
 */
function formatEventDate(dateString) {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-AU', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    })
}

/**
 * Format event time for display
 */
function formatEventTime(dateString) {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-AU', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    })
}

/**
 * Get events for a specific month
 */
async function getEventsForMonth(year, month) {
    try {
        const allEvents = await getFacebookEvents()

        // Filter events for the specified month
        const filteredEvents = allEvents.filter((event) => {
            const eventDate = new Date(event.start_time)
            return (
                eventDate.getFullYear() === year &&
                eventDate.getMonth() === month - 1
            )
        })

        return filteredEvents
    } catch (error) {
        console.error('Error getting events for month:', error)
        throw error
    }
}

module.exports = {
    getPageInfo,
    getFacebookEvents,
    getEventsForMonth,
    formatEventDate,
    formatEventTime,
}

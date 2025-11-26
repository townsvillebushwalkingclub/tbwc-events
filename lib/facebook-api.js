/**
 * Facebook Graph API integration for Townsville Bushwalking Club
 * Fetches events from the TBWC Facebook page
 */

// Timezone configuration for Brisbane, Australia
const BRISBANE_TIMEZONE = 'Australia/Brisbane'

// Try to get the page ID from environment, fallback to username
const FACEBOOK_PAGE_ID = process.env.FACEBOOK_PAGE_ID
const FACEBOOK_ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN

// Check for required environment variables
if (!FACEBOOK_ACCESS_TOKEN) {
    console.warn('FACEBOOK_ACCESS_TOKEN environment variable is not set')
}

if (!FACEBOOK_PAGE_ID) {
    console.warn('FACEBOOK_PAGE_ID environment variable is not set')
}

/**
 * Fetch page information from Facebook Graph API
 */
async function getPageInfo() {
    if (!FACEBOOK_ACCESS_TOKEN) {
        throw new Error('Facebook access token is required')
    }

    const url = `https://graph.facebook.com/v23.0/${FACEBOOK_PAGE_ID}?access_token=${FACEBOOK_ACCESS_TOKEN}&fields=id,name,about,fan_count`

    try {
        const response = await fetch(url)

        if (!response.ok) {
            const errorText = await response.text()
            console.error('Facebook API error response:', errorText)
            throw new Error(
                `Failed to fetch page info: ${response.status} ${response.statusText}`
            )
        }

        const data = await response.json()
        return data
    } catch (error) {
        console.error('Error fetching page info:', error)
        throw error
    }
}

// Cache for events to reduce API calls
let eventsCache = null
let cacheTimestamp = null
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours (matches API route cache)

// Sample data as fallback when API is unavailable (only in development)
const sampleEvents =
    process.env.NODE_ENV === 'development'
        ? [
              {
                  id: 'sample-1',
                  name: 'Sample Event 1',
                  description: 'This is a sample event for testing purposes.',
                  start_time: '2025-08-15T09:00:00+10:00',
                  end_time: '2025-08-15T17:00:00+10:00',
                  formatted_date: 'Friday, 15 August 2025',
                  formatted_time: '9:00 AM',
                  formatted_end_time: '5:00 PM',
                  formatted_end_date: null,
                  is_multi_day: false,
                  attending_count: 5,
                  interested_count: 12,
                  place: { name: 'Sample Location' },
                  cover: null,
              },
              {
                  id: 'sample-2',
                  name: 'Sample Multi-Day Event',
                  description: 'This is a sample multi-day event.',
                  start_time: '2025-08-30T09:00:00+10:00',
                  end_time: '2025-08-31T17:00:00+10:00',
                  formatted_date: 'Saturday, 30 August 2025',
                  formatted_time: '9:00 AM',
                  formatted_end_time: '5:00 PM',
                  formatted_end_date: 'Sunday, 31 August 2025',
                  is_multi_day: true,
                  attending_count: 8,
                  interested_count: 15,
                  place: { name: 'Sample Multi-Day Location' },
                  cover: null,
              },
          ]
        : []

/**
 * Fetch events from Facebook Graph API with caching
 */
/**
 * Check if error is due to token expiration
 */
function isTokenExpiredError(errorData) {
    try {
        const error =
            typeof errorData === 'string' ? JSON.parse(errorData) : errorData
        return (
            error.error &&
            error.error.code === 190 &&
            (error.error.error_subcode === 463 ||
                error.error.error_subcode === 467)
        )
    } catch {
        return false
    }
}

async function getFacebookEvents() {
    if (!FACEBOOK_ACCESS_TOKEN) {
        throw new Error('Facebook access token is required')
    }

    // Check cache first
    const now = Date.now()
    if (
        eventsCache &&
        cacheTimestamp &&
        now - cacheTimestamp < CACHE_DURATION
    ) {
        console.log('Using cached events data')
        return eventsCache
    }

    const url = `https://graph.facebook.com/v23.0/${FACEBOOK_PAGE_ID}/events?access_token=${FACEBOOK_ACCESS_TOKEN}&fields=id,name,description,start_time,end_time,place,attending_count,interested_count,cover&limit=100`

    try {
        const response = await fetch(url)

        if (!response.ok) {
            const errorText = await response.text()
            console.error('Facebook API error response:', errorText)

            // Check if token has expired
            if (isTokenExpiredError(errorText)) {
                console.error('⚠️  Facebook access token has expired!')
                console.error('🔧 To refresh your token, follow these steps:')
                console.error(
                    '   1. Get a new User Access Token from Facebook Graph API Explorer'
                )
                console.error(
                    '   2. Go to: https://developers.facebook.com/tools/explorer/'
                )
                console.error(
                    '   3. Select your app and request permissions: pages_read_engagement, pages_show_list'
                )
                console.error('   4. Copy the generated token')
                console.error(
                    '   5. Run: node get-long-lived-token.js with the new token in your .env file'
                )
                console.error(
                    '   6. Update FACEBOOK_ACCESS_TOKEN in your environment variables'
                )

                // Use cached data if available
                if (eventsCache) {
                    console.log('⚠️  Using cached data while token is expired')
                    return eventsCache
                }
            }

            // If we have cached data and get a rate limit error, return cached data
            if (response.status === 403 && eventsCache) {
                console.log('Rate limit reached, using cached data')
                return eventsCache
            }

            // If no cache and rate limit, return sample data (only in development)
            if (response.status === 403) {
                if (process.env.NODE_ENV === 'development') {
                    console.log(
                        'Rate limit reached, no cache available, using sample data'
                    )
                    return sampleEvents
                } else {
                    console.log(
                        'Rate limit reached, no cache available, returning empty array in production'
                    )
                    return []
                }
            }

            throw new Error(
                `Failed to fetch events: ${response.status} ${response.statusText}`
            )
        }

        const data = await response.json()

        if (!data.data) {
            console.warn('No events data returned from Facebook API')
            return []
        }

        // Format events for our application
        const formattedEvents = data.data.map((event) => {
            const startDate = new Date(event.start_time)
            const endDate = event.end_time ? new Date(event.end_time) : null

            // Check if end date is different from start date
            const isMultiDay =
                endDate && startDate.toDateString() !== endDate.toDateString()

            return {
                id: event.id,
                name: event.name,
                description: event.description || '',
                start_time: event.start_time,
                end_time: event.end_time,
                formatted_date: formatEventDate(event.start_time),
                formatted_time: formatEventTime(event.start_time),
                formatted_end_time: formatEventEndTime(event.end_time),
                formatted_end_date: event.end_time
                    ? formatEventDate(event.end_time)
                    : null,
                is_multi_day: isMultiDay,
                attending_count: event.attending_count || 0,
                interested_count: event.interested_count || 0,
                place: event.place || null,
                cover: event.cover || null,
            }
        })

        // Update cache
        eventsCache = formattedEvents
        cacheTimestamp = now

        return formattedEvents
    } catch (error) {
        console.error('Error fetching Facebook events:', error)

        // If we have cached data, return it instead of throwing
        if (eventsCache) {
            console.log('Using cached data due to error')
            return eventsCache
        }

        // If no cache available, return sample data (only in development)
        if (process.env.NODE_ENV === 'development') {
            console.log('No cache available, using sample data due to error')
            return sampleEvents
        } else {
            console.log(
                'No cache available, returning empty array in production due to error'
            )
            return []
        }
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
        timeZone: BRISBANE_TIMEZONE,
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
        timeZone: BRISBANE_TIMEZONE,
    })
}

/**
 * Format event end time for display
 */
function formatEventEndTime(dateString) {
    if (!dateString) return null
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-AU', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: BRISBANE_TIMEZONE,
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

/**
 * Clear the events cache
 */
function clearEventsCache() {
    eventsCache = null
    cacheTimestamp = null
    console.log('Events cache cleared')
}

module.exports = {
    getPageInfo,
    getFacebookEvents,
    getEventsForMonth,
    formatEventDate,
    formatEventTime,
    formatEventEndTime,
    clearEventsCache,
}

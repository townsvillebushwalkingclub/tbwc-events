/**
 * Facebook Graph API integration for Townsville Bushwalking Club
 * Fetches events from the TBWC Facebook page
 */

const fs = require('fs')
const path = require('path')

// Timezone configuration for Brisbane, Australia
const BRISBANE_TIMEZONE = 'Australia/Brisbane'

// Path to data directory
const DATA_DIR = path.join(process.cwd(), 'data', 'events')

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
        //console.log('Using cached events data')
        return eventsCache
    }

    const url = `https://graph.facebook.com/v23.0/${FACEBOOK_PAGE_ID}/events?access_token=${FACEBOOK_ACCESS_TOKEN}&fields=id,name,description,start_time,end_time,place,attending_count,interested_count,cover,is_canceled&limit=100`

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
        const {
            downloadCoverImage,
            getCoverImagePath,
        } = require('./download-cover-image.js')

        const formattedEvents = await Promise.all(
            data.data.map(async (event) => {
                const startDate = new Date(event.start_time)
                const endDate = event.end_time ? new Date(event.end_time) : null

                // Check if end date is different from start date
                const isMultiDay =
                    endDate &&
                    startDate.toDateString() !== endDate.toDateString()

                // Handle cover image: download if needed, but prefer local if exists
                let cover = event.cover || null
                if (cover && cover.source) {
                    // Check if local image exists first (for past events)
                    const localPath = getCoverImagePath(event.id, cover.source)
                    if (localPath && localPath.startsWith('/event-covers/')) {
                        // Use local path if it exists
                        cover = {
                            ...cover,
                            source: localPath,
                        }
                    } else {
                        // Download image for current/future events (if not already downloaded)
                        await downloadCoverImage(event.id, cover.source)
                        // Check again after download attempt
                        const downloadedPath = getCoverImagePath(
                            event.id,
                            cover.source
                        )
                        if (
                            downloadedPath &&
                            downloadedPath.startsWith('/event-covers/')
                        ) {
                            cover = {
                                ...cover,
                                source: downloadedPath,
                            }
                        }
                        // Otherwise keep original URL
                    }
                }

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
                    cover: cover,
                    is_cancelled: event.is_canceled === true,
                }
            })
        )

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
 * Fetch a single event by ID from the Facebook Graph API.
 * Used for cancelled events (which may be omitted from the Page events list) and direct links.
 * Returns null if the event is not found or the API errors.
 */
async function fetchEventByIdFromApi(eventId) {
    if (!FACEBOOK_ACCESS_TOKEN) return null
    const fields =
        'id,name,description,start_time,end_time,place,attending_count,interested_count,cover,is_canceled'
    const url = `https://graph.facebook.com/v23.0/${eventId}?access_token=${FACEBOOK_ACCESS_TOKEN}&fields=${fields}`
    try {
        const response = await fetch(url)
        if (!response.ok) return null
        const event = await response.json()
        if (!event || !event.id) return null

        const {
            downloadCoverImage,
            getCoverImagePath,
        } = require('./download-cover-image.js')
        const startDate = new Date(event.start_time)
        const endDate = event.end_time ? new Date(event.end_time) : null
        const isMultiDay =
            endDate &&
            startDate.toDateString() !== endDate.toDateString()

        let cover = event.cover || null
        if (cover && cover.source) {
            const localPath = getCoverImagePath(event.id, cover.source)
            if (localPath && localPath.startsWith('/event-covers/')) {
                cover = { ...cover, source: localPath }
            } else {
                await downloadCoverImage(event.id, cover.source)
                const downloadedPath = getCoverImagePath(event.id, cover.source)
                if (
                    downloadedPath &&
                    downloadedPath.startsWith('/event-covers/')
                ) {
                    cover = { ...cover, source: downloadedPath }
                }
            }
        }

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
            cover: cover,
            is_cancelled: event.is_canceled === true,
        }
    } catch (error) {
        console.warn('Error fetching event by ID from API:', error.message)
        return null
    }
}

/**
 * Get list of cancelled event IDs to fetch from API (events omitted from Page list).
 * Reads data/events/cancelled-event-ids.json.
 */
function getCancelledEventIds() {
    const filePath = path.join(DATA_DIR, 'cancelled-event-ids.json')
    try {
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8')
            const data = JSON.parse(content)
            const ids = Array.isArray(data) ? data : (data.ids || [])
            return ids
                .filter((id) => id != null)
                .map((id) => String(id).trim())
                .filter((id) => /^\d{15,16}$/.test(id))
        }
    } catch (err) {
        console.warn('Error reading cancelled-event-ids.json:', err.message)
    }
    return []
}

/**
 * Check if a month is in the past
 */
function isPastMonth(year, month) {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1

    if (year < currentYear) {
        return true
    }
    if (year === currentYear && month < currentMonth) {
        return true
    }
    return false
}

/**
 * Get file path for a specific month's events
 */
function getMonthFilePath(year, month) {
    const yearDir = path.join(DATA_DIR, year.toString())
    return path.join(yearDir, `${month.toString().padStart(2, '0')}.json`)
}

/**
 * Load events from file for a specific month
 * Checks for local cover images and updates cover.source if local image exists
 */
function loadEventsFromFile(year, month) {
    try {
        const filePath = getMonthFilePath(year, month)
        if (fs.existsSync(filePath)) {
            const fileContent = fs.readFileSync(filePath, 'utf8')
            const events = JSON.parse(fileContent)

            // Check for local cover images and update cover.source if they exist
            const { getCoverImagePath } = require('./download-cover-image.js')
            const updatedEvents = events.map((event) => {
                if (event.cover && event.cover.source) {
                    const localPath = getCoverImagePath(
                        event.id,
                        event.cover.source
                    )
                    if (localPath && localPath.startsWith('/event-covers/')) {
                        // Update to use local image
                        return {
                            ...event,
                            cover: {
                                ...event.cover,
                                source: localPath,
                            },
                        }
                    }
                }
                return event
            })

            //console.log(
            //    `Loaded ${updatedEvents.length} events from file for ${year}/${month}`
            //)
            return updatedEvents
        }
    } catch (error) {
        console.error(
            `Error loading events from file for ${year}/${month}:`,
            error
        )
    }
    return null
}

/**
 * Save events to file for a specific month.
 * Downloads cover images when needed and persists local paths in JSON.
 */
async function saveEventsToFile(year, month, events) {
    try {
        const { downloadCoverImage, getCoverImagePath } =
            require('./download-cover-image.js')

        const eventsToSave = await Promise.all(
            events.map(async (event) => {
                if (!event.cover || !event.cover.source) return event
                const src = event.cover.source
                if (src.startsWith('/event-covers/')) return event
                const localPath =
                    getCoverImagePath(event.id, src) ||
                    (await downloadCoverImage(event.id, src))
                if (localPath && localPath.startsWith('/event-covers/')) {
                    return {
                        ...event,
                        cover: { ...event.cover, source: localPath },
                    }
                }
                return event
            })
        )

        const yearDir = path.join(DATA_DIR, year.toString())
        if (!fs.existsSync(yearDir)) {
            fs.mkdirSync(yearDir, { recursive: true })
        }

        const filePath = getMonthFilePath(year, month)
        fs.writeFileSync(
            filePath,
            JSON.stringify(eventsToSave, null, 2),
            'utf8'
        )
        console.log(
            `Saved ${eventsToSave.length} events to file for ${year}/${month}`
        )
    } catch (error) {
        console.error(
            `Error saving events to file for ${year}/${month}:`,
            error
        )
    }
}

/**
 * Get events for a specific month
 * For past months, checks for saved data files first
 */
async function getEventsForMonth(year, month) {
    try {
        // Check if this is a past month
        if (isPastMonth(year, month)) {
            // Try to load from file first
            const fileEvents = loadEventsFromFile(year, month)
            if (fileEvents !== null) {
                return fileEvents
            }

            // If file doesn't exist, fetch from Facebook and save it
            console.log(
                `No saved data found for past month ${year}/${month}, fetching from Facebook...`
            )
        }

        // Fetch from Facebook API
        const allEvents = await getFacebookEvents()

        // Filter events for the specified month
        const filteredEvents = allEvents.filter((event) => {
            const eventDate = new Date(event.start_time)
            return (
                eventDate.getFullYear() === year &&
                eventDate.getMonth() === month - 1
            )
        })

        // If this is a past month and we fetched from Facebook, save to file
        if (isPastMonth(year, month) && filteredEvents.length > 0) {
            await saveEventsToFile(year, month, filteredEvents)
        }

        // Merge cancelled events fetched by ID from API (when omitted from Page list)
        const cancelledIds = getCancelledEventIds()
        const existingIds = new Set(filteredEvents.map((e) => e.id))
        for (const id of cancelledIds) {
            if (existingIds.has(id)) continue
            const event = await fetchEventByIdFromApi(id)
            if (event) {
                const eventDate = new Date(event.start_time)
                if (
                    eventDate.getFullYear() === year &&
                    eventDate.getMonth() === month - 1
                ) {
                    filteredEvents.push(event)
                    existingIds.add(event.id)
                }
            }
        }
        filteredEvents.sort(
            (a, b) => new Date(a.start_time) - new Date(b.start_time)
        )

        return filteredEvents
    } catch (error) {
        console.error('Error getting events for month:', error)
        throw error
    }
}

/**
 * Get events for multiple months with a single Facebook API call.
 * Use this for the homepage calendar to avoid 3x getFacebookEvents() and rate limits.
 * @param {Array<{ year: number, month: number }>} months - e.g. [{ year: 2026, month: 2 }, { year: 2026, month: 3 }]
 * @returns {Promise<Array>} Combined, sorted events for all requested months
 */
async function getEventsForCalendarMonths(months) {
    if (!months || months.length === 0) return []
    const allEvents = await getFacebookEvents()
    const cancelledIds = getCancelledEventIds()
    const existingIds = new Set()
    const byMonth = new Map()
    for (const { year, month } of months) {
        const key = `${year}-${month}`
        const filtered = allEvents.filter((event) => {
            const eventDate = new Date(event.start_time)
            return (
                eventDate.getFullYear() === year &&
                eventDate.getMonth() === month - 1
            )
        })
        filtered.forEach((e) => existingIds.add(e.id))
        byMonth.set(key, filtered)
    }
    for (const id of cancelledIds) {
        if (existingIds.has(id)) continue
        const event = await fetchEventByIdFromApi(id)
        if (!event) continue
        const eventDate = new Date(event.start_time)
        const y = eventDate.getFullYear()
        const m = eventDate.getMonth() + 1
        const key = `${y}-${m}`
        if (byMonth.has(key)) {
            byMonth.get(key).push(event)
            existingIds.add(event.id)
        }
    }
    const combined = []
    for (const list of byMonth.values()) {
        list.sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
        combined.push(...list)
    }
    combined.sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
    return combined
}

/**
 * Get a single event by ID
 * Searches through all available months (current, past files, and Facebook)
 */
async function getEventById(eventId) {
    try {
        // First, check the cache
        if (eventsCache) {
            const cachedEvent = eventsCache.find((e) => e.id === eventId)
            if (cachedEvent) {
                return cachedEvent
            }
        }

        // Try to find in past month files
        // Check all available year directories
        try {
            if (fs.existsSync(DATA_DIR)) {
                const yearDirs = fs
                    .readdirSync(DATA_DIR)
                    .filter((dir) => {
                        const dirPath = path.join(DATA_DIR, dir)
                        return (
                            fs.statSync(dirPath).isDirectory() &&
                            /^\d{4}$/.test(dir)
                        )
                    })
                    .map((dir) => parseInt(dir))
                    .sort((a, b) => b - a) // Sort descending (newest first)

                for (const year of yearDirs) {
                    const yearDir = path.join(DATA_DIR, year.toString())
                    const monthFiles = fs
                        .readdirSync(yearDir)
                        .filter((file) => file.endsWith('.json'))
                        .map((file) => parseInt(file.replace('.json', '')))
                        .sort((a, b) => b - a) // Sort descending

                    for (const month of monthFiles) {
                        const fileEvents = loadEventsFromFile(year, month)
                        if (fileEvents) {
                            const event = fileEvents.find(
                                (e) => e.id === eventId
                            )
                            if (event) {
                                return event
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error searching past event files:', error)
            // Continue to try Facebook API
        }

        // Fetch single event from API (cancelled events may be omitted from Page list)
        const fromApi = await fetchEventByIdFromApi(eventId)
        if (fromApi) return fromApi

        // If not found in files or by ID, fetch from Facebook list
        const allEvents = await getFacebookEvents()
        const event = allEvents.find((e) => e.id === eventId)

        return event || null
    } catch (error) {
        console.error('Error getting event by ID:', error)
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

/**
 * Get all events from all sources (Facebook API and saved files)
 * Used for sitemap generation
 */
async function getAllEvents() {
    const allEvents = []

    try {
        // Get current events from Facebook API
        const currentEvents = await getFacebookEvents()
        allEvents.push(...currentEvents)

        // Get events from saved files
        if (fs.existsSync(DATA_DIR)) {
            const yearDirs = fs
                .readdirSync(DATA_DIR)
                .filter((dir) => {
                    const dirPath = path.join(DATA_DIR, dir)
                    return (
                        fs.statSync(dirPath).isDirectory() &&
                        /^\d{4}$/.test(dir)
                    )
                })
                .map((dir) => parseInt(dir))
                .sort((a, b) => b - a) // Sort descending (newest first)

            for (const year of yearDirs) {
                const yearDir = path.join(DATA_DIR, year.toString())
                const monthFiles = fs
                    .readdirSync(yearDir)
                    .filter((file) => file.endsWith('.json'))
                    .map((file) => parseInt(file.replace('.json', '')))
                    .sort((a, b) => b - a) // Sort descending

                for (const month of monthFiles) {
                    const fileEvents = loadEventsFromFile(year, month)
                    if (fileEvents) {
                        // Add events that aren't already in the list (avoid duplicates)
                        fileEvents.forEach((event) => {
                            if (!allEvents.find((e) => e.id === event.id)) {
                                allEvents.push(event)
                            }
                        })
                    }
                }
            }
        }

        // Add cancelled events fetched by ID from API
        const cancelledIds = getCancelledEventIds()
        for (const id of cancelledIds) {
            if (allEvents.some((e) => e.id === id)) continue
            const event = await fetchEventByIdFromApi(id)
            if (event) allEvents.push(event)
        }
    } catch (error) {
        console.error('Error getting all events for sitemap:', error)
    }

    // Normalize cover URLs so all events use local /event-covers/ when available
    const { getCoverImagePath } = require('./download-cover-image.js')
    return allEvents.map((event) => {
        if (event.cover && event.cover.source) {
            const localPath = getCoverImagePath(
                event.id,
                event.cover.source
            )
            if (localPath && localPath.startsWith('/event-covers/')) {
                return {
                    ...event,
                    cover: { ...event.cover, source: localPath },
                }
            }
        }
        return event
    })
}

module.exports = {
    getPageInfo,
    getFacebookEvents,
    getEventsForMonth,
    getEventsForCalendarMonths,
    getEventById,
    getAllEvents,
    formatEventDate,
    formatEventTime,
    formatEventEndTime,
    clearEventsCache,
}

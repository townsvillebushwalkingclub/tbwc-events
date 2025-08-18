import fetch from 'node-fetch'
import { format, parseISO } from 'date-fns'
import dotenv from 'dotenv'
import eventCache from './cache.js'

// Load environment variables
dotenv.config()

const FACEBOOK_PAGE_ID = 'townsvillebushwalkingclub'
const FACEBOOK_ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN

if (!FACEBOOK_ACCESS_TOKEN) {
    console.warn('⚠️  FACEBOOK_ACCESS_TOKEN not found in environment variables')
    console.warn('   Please set FACEBOOK_ACCESS_TOKEN in your .env file')
    console.warn(
        '   You can get a token from: https://developers.facebook.com/tools/explorer/'
    )
}

export async function getFacebookEvents() {
    console.log('🔍 Checking Facebook access token...')
    console.log('Token exists:', !!FACEBOOK_ACCESS_TOKEN)
    console.log(
        'Token length:',
        FACEBOOK_ACCESS_TOKEN ? FACEBOOK_ACCESS_TOKEN.length : 0
    )

    if (!FACEBOOK_ACCESS_TOKEN) {
        throw new Error(
            'Facebook access token is required. Please set FACEBOOK_ACCESS_TOKEN in your .env file'
        )
    }

    // Check cache first
    const cacheKey = 'all_events'
    const cachedEvents = eventCache.get(cacheKey)

    if (cachedEvents) {
        console.log(`📦 Returning ${cachedEvents.length} events from cache`)
        return cachedEvents
    }

    try {
        console.log('🌐 Fetching events from Facebook API...')

        // First, get the page ID from the username
        const pageInfoUrl = `https://graph.facebook.com/v18.0/${FACEBOOK_PAGE_ID}?access_token=${FACEBOOK_ACCESS_TOKEN}`
        const pageResponse = await fetch(pageInfoUrl)

        if (!pageResponse.ok) {
            throw new Error(
                `Failed to fetch page info: ${pageResponse.statusText}`
            )
        }

        const pageData = await pageResponse.json()
        const pageId = pageData.id

        // Now fetch events from the page
        const eventsUrl = `https://graph.facebook.com/v18.0/${pageId}/events?access_token=${FACEBOOK_ACCESS_TOKEN}&fields=id,name,description,start_time,end_time,place,cover,attending_count,interested_count,is_canceled,event_times&limit=100`

        const eventsResponse = await fetch(eventsUrl)

        if (!eventsResponse.ok) {
            throw new Error(
                `Failed to fetch events: ${eventsResponse.statusText}`
            )
        }

        const eventsData = await eventsResponse.json()

        if (!eventsData.data) {
            console.warn('No events data found in response:', eventsData)
            return []
        }

        // Process and format the events
        const processedEvents = eventsData.data
            .filter((event) => !event.is_canceled) // Filter out canceled events
            .map((event) => ({
                id: event.id,
                name: event.name,
                description: event.description || '',
                start_time: event.start_time,
                end_time: event.end_time,
                place: event.place
                    ? {
                          name: event.place.name,
                          location: event.place.location,
                          street: event.place.street,
                          city: event.place.city,
                          state: event.place.state,
                          country: event.place.country,
                          zip: event.place.zip,
                      }
                    : null,
                cover: event.cover
                    ? {
                          source: event.cover.source,
                          id: event.cover.id,
                      }
                    : null,
                attending_count: event.attending_count || 0,
                interested_count: event.interested_count || 0,
                is_canceled: event.is_canceled || false,
                event_times: event.event_times || [],
                formatted_date: format(
                    parseISO(event.start_time),
                    'EEEE, MMMM do, yyyy'
                ),
                formatted_time: format(parseISO(event.start_time), 'h:mm a'),
                formatted_end_time: event.end_time
                    ? format(parseISO(event.end_time), 'h:mm a')
                    : null,
                month: format(parseISO(event.start_time), 'MMMM'),
                year: format(parseISO(event.start_time), 'yyyy'),
                day: format(parseISO(event.start_time), 'd'),
            }))
            .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))

        console.log(`✅ Fetched ${processedEvents.length} events from Facebook`)

        // Cache the results for 7 days
        eventCache.set(cacheKey, processedEvents)

        return processedEvents
    } catch (error) {
        console.error('❌ Error fetching Facebook events:', error)
        throw error
    }
}

export async function getEventsByMonth(year, month) {
    const events = await getFacebookEvents()
    return events.filter((event) => {
        const eventDate = new Date(event.start_time)
        return (
            eventDate.getFullYear() === year &&
            eventDate.getMonth() === month - 1
        )
    })
}

export async function getUpcomingEvents(limit = 10) {
    const events = await getFacebookEvents()
    const now = new Date()

    return events
        .filter((event) => new Date(event.start_time) > now)
        .slice(0, limit)
}

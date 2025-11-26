import { getEventById, getAllEvents } from '@/lib/facebook-api.js'
import EventClient from './EventClient'

// Check if event is in the past (has already occurred)
function isPastEvent(eventDate) {
    const now = new Date()
    const event = new Date(eventDate)
    // Compare dates (ignore time for month comparison)
    now.setHours(0, 0, 0, 0)
    event.setHours(0, 0, 0, 0)
    return event < now
}

// Check if event is in current or future month
function isCurrentOrFutureMonth(eventDate) {
    const now = new Date()
    const event = new Date(eventDate)
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1
    const eventYear = event.getFullYear()
    const eventMonth = event.getMonth() + 1

    if (eventYear > currentYear) return true
    if (eventYear === currentYear && eventMonth >= currentMonth) return true
    return false
}

// Generate metadata for the event page (runs server-side)
export async function generateMetadata({ params }) {
    try {
        const { id } = await params
        const event = await getEventById(id)

        if (!event) {
            return {
                title: 'Event Not Found - Townsville Bushwalking Club',
                description: 'The event you are looking for does not exist.',
            }
        }

        const description = event.description
            ? event.description.substring(0, 160).replace(/\n/g, ' ')
            : `Join us for ${event.name} on ${event.formatted_date}. ${
                  event.place ? `Location: ${event.place.name}` : ''
              }`

        const coverImageUrl =
            event.cover && event.cover.source ? event.cover.source : null

        return {
            title: `${event.name} - Townsville Bushwalking Club`,
            description: description,
            keywords: [
                'Townsville Bushwalking Club',
                'bushwalking',
                'hiking',
                event.name,
                event.place?.name || 'Townsville',
                'North Queensland',
            ],
            openGraph: {
                title: event.name,
                description: description,
                type: 'website',
                url: `https://events.townsvillebushwalkingclub.com/events/${id}`,
                siteName: 'Townsville Bushwalking Club Events',
                locale: 'en_AU',
                images: coverImageUrl
                    ? [
                          {
                              url: coverImageUrl,
                              width: event.cover?.width || 1200,
                              height: event.cover?.height || 630,
                              alt: event.name,
                          },
                      ]
                    : [],
            },
            twitter: {
                card: coverImageUrl ? 'summary_large_image' : 'summary',
                title: event.name,
                description: description,
                images: coverImageUrl ? [coverImageUrl] : [],
            },
            alternates: {
                canonical: `/events/${id}`,
            },
        }
    } catch (error) {
        console.error('Error generating metadata:', error)
        return {
            title: 'Event - Townsville Bushwalking Club',
            description: 'View event details for Townsville Bushwalking Club.',
        }
    }
}

export default async function EventPage({ params }) {
    const { id } = await params
    let event = null

    try {
        // Fetch event server-side for initial render
        event = await getEventById(id)

        // For past events, we want them to be fully static (no revalidation)
        // Since Next.js doesn't support per-route revalidation, past events
        // are pre-generated and won't change, making revalidation effectively a no-op
        if (event && event.start_time) {
            const now = new Date()
            const eventDate = new Date(event.start_time)
            now.setHours(0, 0, 0, 0)
            eventDate.setHours(0, 0, 0, 0)

            // Past events are immutable - they won't change
            // Future events will be revalidated daily via the route-level revalidate export
            const isPast = eventDate < now
            // Note: We can't disable revalidation per-route, but past events
            // are pre-generated and immutable, so revalidation is effectively static
        }
    } catch (error) {
        console.error('Error fetching event:', error)
        // Event will be null, client component will handle error state
    }

    return <EventClient initialEvent={event} />
}

// Generate static params for ISR (Incremental Static Regeneration)
// Pre-generate pages for ALL events at build time
// Past events: Fully static (no revalidation) - they never change
// Future events: Pre-generated but revalidated daily
export async function generateStaticParams() {
    try {
        const allEvents = await getAllEvents()

        // Return params for ALL events
        // Past events will be fully static (no revalidation)
        // Future events will be pre-generated but revalidated daily
        return allEvents
            .filter((event) => event.id) // Only include events with valid IDs
            .filter((event) => isPastEvent(event.start_time)) // Only include past events
            .map((event) => ({
                id: event.id,
            }))
    } catch (error) {
        console.error('Error generating static params for events:', error)
        return []
    }
}

// Route segment config for ISR (Incremental Static Regeneration)
// Revalidation strategy:
// - Past events: Pre-generated at build time, effectively static (they never change)
//   Since they're immutable, revalidation will just confirm they're unchanged
// - Current/future events: Revalidate daily (86400 seconds) to get updates
//
// Note: Next.js doesn't support per-route revalidation in the same dynamic segment.
// Past events are pre-generated and won't change, so revalidation is effectively a no-op.
// Future events will be revalidated daily to pick up any changes.
export const revalidate = 86400 // 1 day - ensures current/future events stay fresh

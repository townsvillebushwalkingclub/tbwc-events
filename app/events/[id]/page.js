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

        // Security: Validate event ID format (must be 15 or 16 numeric digits)
        if (!id || !/^\d{15,16}$/.test(id)) {
            return {
                title: 'Event Not Found - Townsville Bushwalking Club',
                description: 'The event you are looking for does not exist.',
            }
        }

        const event = await getEventById(id)

        if (!event) {
            return {
                title: 'Event Not Found - Townsville Bushwalking Club',
                description: 'The event you are looking for does not exist.',
            }
        }

        // Security: Block events outside allowed date range
        if (event.start_time) {
            const now = new Date()
            const minYear = 2020
            const eventDate = new Date(event.start_time)
            // Calculate the date 6 months from now (last day of that month to be more lenient)
            const maxFutureDate = new Date(
                now.getFullYear(),
                now.getMonth() + 7,
                0, // Day 0 = last day of previous month (6 months from now)
            )

            if (
                eventDate.getFullYear() < minYear ||
                eventDate > maxFutureDate
            ) {
                return {
                    title: 'Event Not Found - Townsville Bushwalking Club',
                    description:
                        'The event you are looking for does not exist.',
                }
            }
        }

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
        // Security: Validate event ID format (must be 15 or 16 numeric digits)
        if (!id || !/^\d{15,16}$/.test(id)) {
            // Invalid ID format - return 404 to prevent enumeration
            return (
                <div className="min-h-screen bg-white flex items-center justify-center">
                    <div className="text-center text-gray-900">
                        <h1 className="text-2xl font-bold mb-4">
                            Event Not Found
                        </h1>
                        <p className="text-gray-600">
                            The event you are looking for does not exist.
                        </p>
                    </div>
                </div>
            )
        }

        // Fetch event server-side for initial render
        event = await getEventById(id)

        // Security: Block events before 2019 or more than 6 months in the future
        if (event && event.start_time) {
            const now = new Date()
            const minYear = 2019
            const eventDate = new Date(event.start_time)
            // Calculate the date 6 months from now (last day of that month to be more lenient)
            const maxFutureDate = new Date(
                now.getFullYear(),
                now.getMonth() + 7,
                0, // Day 0 = last day of previous month (6 months from now)
            )

            if (
                eventDate.getFullYear() < minYear ||
                eventDate > maxFutureDate
            ) {
                // Event outside allowed range - return 404 to prevent information disclosure
                return (
                    <div className="min-h-screen bg-white flex items-center justify-center">
                        <div className="text-center text-gray-900">
                            <h1 className="text-2xl font-bold mb-4">
                                Event Not Found
                            </h1>
                            <p className="text-gray-600">
                                The event you are looking for does not exist.
                            </p>
                        </div>
                    </div>
                )
            }
        }

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
// Only pre-generate past events at build time (they're immutable and never change)
// Future events are NOT pre-generated - they'll be dynamically rendered on-demand
export async function generateStaticParams() {
    try {
        const allEvents = await getAllEvents()

        // Only include past events in static params
        // Past events are immutable (never change on Facebook), so they can be fully static
        // Future events will be dynamically rendered and cached with revalidation
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
// - Past events: Pre-generated at build time (SSG), fully static
//   The revalidate setting applies but is effectively a no-op since past events never change
// - Current/future events: Dynamically rendered on-demand, cached and revalidated daily (86400 seconds)
//
// Note: Next.js doesn't support per-route revalidation in the same dynamic segment.
// Past events are pre-generated and immutable, so revalidation is effectively a no-op.
// Future events are dynamically rendered and will be revalidated daily to pick up any changes.
export const revalidate = 86400 // 1 day - ensures current/future events stay fresh

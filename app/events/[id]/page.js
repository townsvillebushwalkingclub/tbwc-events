import { getEventById } from '@/lib/facebook-api.js'
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
            : `Join us for ${event.name} on ${event.formatted_date}. ${event.place ? `Location: ${event.place.name}` : ''}`

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
    } catch (error) {
        console.error('Error fetching event:', error)
        // Event will be null, client component will handle error state
    }

    return <EventClient initialEvent={event} />
}

// Route segment config for ISR (Incremental Static Regeneration)
// Revalidation strategy:
// - Past events: Fully static, no revalidation needed (they never change)
// - Current/future events: Revalidate daily to get updates
//
// Since Next.js doesn't support per-page revalidation in the same route,
// we use daily revalidation for all pages. Past events won't change, so
// the revalidation check will just confirm they're still the same.
// The API route also handles caching appropriately per event date.
export const revalidate = 86400 // 1 day - ensures current/future events stay fresh
// Past events are effectively static since they never change on Facebook

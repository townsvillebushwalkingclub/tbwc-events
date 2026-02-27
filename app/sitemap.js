import { getAllEvents } from '@/lib/facebook-api.js'

// Cache sitemap for 1 day
export const revalidate = 86400

export default async function sitemap() {
    const baseUrl = 'https://events.townsvillebushwalkingclub.com'
    
    // Get all events from Facebook API and saved files
    let events = []
    try {
        events = await getAllEvents()
        console.log(`Sitemap: Found ${events.length} events`)
    } catch (error) {
        console.error('Error fetching events for sitemap:', error)
    }

    // Homepage entry
    const routes = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1.0,
        },
    ]

    // Add event pages (only within allowed range: 2022 to 3 months ahead)
    const now = new Date()
    const minYear = 2022
    const maxFutureDate = new Date(now.getFullYear(), now.getMonth() + 3, 1)
    events.forEach((event) => {
        if (!event || !event.id) return

        const eventDate = event.start_time ? new Date(event.start_time) : null
        if (eventDate && (eventDate.getFullYear() < minYear || eventDate >= maxFutureDate)) return
        const isPast = eventDate && eventDate < now

        routes.push({
            url: `${baseUrl}/events/${event.id}`,
            lastModified: eventDate || new Date(),
            changeFrequency: isPast ? 'never' : 'daily',
            priority: isPast ? 0.5 : 0.8,
        })
    })

    return routes
}


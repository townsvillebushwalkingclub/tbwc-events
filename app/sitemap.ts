import type { MetadataRoute } from 'next'
import { getAllEvents } from '@/lib/facebook-api'

export const revalidate = 21600 // FACEBOOK_EVENTS_REVALIDATE_SECONDS

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://events.townsvillebushwalkingclub.com'

  let events: Awaited<ReturnType<typeof getAllEvents>> = []
  try {
    events = await getAllEvents()
    console.log(`Sitemap: Found ${events.length} events`)
  } catch (error) {
    console.error('Error fetching events for sitemap:', error)
  }

  // Print poster routes (/poster/*) are intentionally omitted (noindex, not for search).
  // Omit lastModified: we have no reliable page-modification timestamps (event
  // start_time and sitemap generation time are not last-content-change dates).
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/events/all`,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/events/search`,
      changeFrequency: 'yearly',
      priority: 0.7,
    },
  ]

  const now = new Date()
  events.forEach((event) => {
    if (!event?.id) return
    const eventDate = event.start_time ? new Date(event.start_time) : null
    const isPast = eventDate && eventDate < now
    routes.push({
      url: `${baseUrl}/events/${event.id}`,
      changeFrequency: isPast ? 'never' : 'weekly',
      priority: isPast ? 0.1 : 0.9,
    })
  })

  return routes
}

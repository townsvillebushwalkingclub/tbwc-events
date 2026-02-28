import type { MetadataRoute } from 'next'
import { getAllEvents } from '@/lib/facebook-api'

export const revalidate = 86400

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://events.townsvillebushwalkingclub.com'

  let events: Awaited<ReturnType<typeof getAllEvents>> = []
  try {
    events = await getAllEvents()
    console.log(`Sitemap: Found ${events.length} events`)
  } catch (error) {
    console.error('Error fetching events for sitemap:', error)
  }

  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/events/all`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/events/search`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
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
      lastModified: eventDate || new Date(),
      changeFrequency: isPast ? 'yearly' : 'daily',
      priority: isPast ? 0.5 : 0.8,
    })
  })

  return routes
}

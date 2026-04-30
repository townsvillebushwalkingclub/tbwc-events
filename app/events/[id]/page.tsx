import { getEventById, getAllEvents } from '@/lib/facebook-api'
import { isValidFacebookEventId } from '@/lib/event-id'
import { absoluteEventShareImageUrl, EVENTS_SITE_ORIGIN } from '@/lib/site'
import { notFound } from 'next/navigation'
import EventClient from './EventClient'

function isPastEvent(eventDate: string): boolean {
  const now = new Date()
  const event = new Date(eventDate)
  now.setHours(0, 0, 0, 0)
  event.setHours(0, 0, 0, 0)
  return event < now
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  try {
    const { id } = await params
    const getNotFoundMeta = () => ({
      title: 'Event Not Found - Townsville Bushwalking Club',
      description: 'The event you are looking for does not exist.',
      robots: { index: false, follow: true } as const,
      openGraph: {
        title: 'Event Not Found - Townsville Bushwalking Club',
        description: 'The event you are looking for does not exist.',
        url: `${EVENTS_SITE_ORIGIN}/events/${id ?? ''}`,
        siteName: 'Townsville Bushwalking Club Events',
        locale: 'en_AU',
        type: 'website',
      },
      twitter: {
        card: 'summary' as const,
        title: 'Event Not Found - Townsville Bushwalking Club',
        description: 'The event you are looking for does not exist.',
      },
    })

    if (!id || !isValidFacebookEventId(id)) return getNotFoundMeta()

    const event = await getEventById(id)
    if (!event) {
      return getNotFoundMeta()
    }

    if (event.start_time) {
      const now = new Date()
      const minYear = 2020
      const eventDate = new Date(event.start_time)
      const maxFutureDate = new Date(
        now.getFullYear(),
        now.getMonth() + 4,
        0
      )
      if (
        eventDate.getFullYear() < minYear ||
        eventDate > maxFutureDate
      ) {
        return getNotFoundMeta()
      }
    }

    const description = event.description
      ? event.description.substring(0, 160).replace(/\n/g, ' ')
      : `Join us for ${event.name} on ${event.formatted_date}. ${
          event.place ? `Location: ${event.place.name}` : ''
        }`

    const coverSource = event.cover?.source ?? null
    const ogImageUrl = absoluteEventShareImageUrl(coverSource)

    return {
      title: `${event.name} - Townsville Bushwalking Club`,
      description,
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
        description,
        type: 'website',
        url: `${EVENTS_SITE_ORIGIN}/events/${id}`,
        siteName: 'Townsville Bushwalking Club Events',
        locale: 'en_AU',
        images: ogImageUrl
          ? [
              {
                url: ogImageUrl,
                width: (event.cover as { width?: number })?.width || 1200,
                height: (event.cover as { height?: number })?.height || 630,
                alt: event.name,
              },
            ]
          : [],
      },
      twitter: {
        card: ogImageUrl ? 'summary_large_image' : 'summary',
        title: event.name,
        description,
        images: ogImageUrl ? [ogImageUrl] : [],
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
      robots: { index: false, follow: true },
      openGraph: {
        title: 'Event - Townsville Bushwalking Club',
        description: 'View event details for Townsville Bushwalking Club.',
        siteName: 'Townsville Bushwalking Club Events',
        locale: 'en_AU',
        type: 'website',
      },
      twitter: {
        card: 'summary',
        title: 'Event - Townsville Bushwalking Club',
        description: 'View event details for Townsville Bushwalking Club.',
      },
    }
  }
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  let event = null

  try {
    if (!id || !isValidFacebookEventId(id)) notFound()

    event = await getEventById(id)
    if (!event) notFound()

    if (event?.start_time) {
      const now = new Date()
      const minYear = 2019
      const eventDate = new Date(event.start_time)
      const maxFutureDate = new Date(
        now.getFullYear(),
        now.getMonth() + 4,
        0
      )
      if (eventDate.getFullYear() < minYear || eventDate > maxFutureDate) {
        notFound()
      }
    }
  } catch (error) {
    console.error('Error fetching event:', error)
    throw error
  }

  return <EventClient initialEvent={event} />
}

export async function generateStaticParams() {
  try {
    const allEvents = await getAllEvents()
    return allEvents
      .filter((event) => event.id)
      .filter((event) => isPastEvent(event.start_time))
      .map((event) => ({ id: event.id }))
  } catch (error) {
    console.error('Error generating static params for events:', error)
    return []
  }
}

export const revalidate = 86400

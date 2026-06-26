import { NextResponse } from 'next/server'
import { buildVCalendar, slugifyEventFilename } from '@/lib/calendar-ics'
import { isValidFacebookEventId } from '@/lib/event-id'
import { getEventById, getPastEventIdsFromFiles } from '@/lib/facebook-api'
import { FACEBOOK_EVENTS_REVALIDATE_SECONDS } from '@/lib/cache-constants'

export const revalidate = 21600 // FACEBOOK_EVENTS_REVALIDATE_SECONDS

const ICS_CONTENT_TYPE = 'text/calendar; charset=utf-8'

function normalizeIso(iso: string): string {
  return iso.replace(/([+-]\d{2})(\d{2})$/, '$1:$2')
}

/** Prerender calendar downloads for past event IDs (they won't change). */
export async function generateStaticParams() {
  const ids = getPastEventIdsFromFiles()
  return ids.map((id) => ({ id }))
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    if (!id) {
      return new NextResponse('Event ID is required', {
        status: 400,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      })
    }

    if (!isValidFacebookEventId(id)) {
      return new NextResponse('Invalid event ID format', {
        status: 400,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      })
    }

    const event = await getEventById(id)

    if (!event) {
      return new NextResponse('Event not found', {
        status: 404,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      })
    }

    if (event.start_time) {
      const now = new Date()
      const minYear = 2019
      const eventDate = new Date(normalizeIso(event.start_time))
      const maxFutureDate = new Date(
        now.getFullYear(),
        now.getMonth() + 4,
        0
      )

      if (eventDate.getFullYear() < minYear) {
        return new NextResponse(
          `Events before ${minYear} are not available`,
          {
            status: 403,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          }
        )
      }

      if (eventDate > maxFutureDate) {
        return new NextResponse(
          'Events more than 3 months in the future are not available',
          {
            status: 403,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          }
        )
      }
    }

    let cacheTime = FACEBOOK_EVENTS_REVALIDATE_SECONDS
    if (event.start_time) {
      const now = new Date()
      const eventDate = new Date(normalizeIso(event.start_time))
      now.setHours(0, 0, 0, 0)
      eventDate.setHours(0, 0, 0, 0)
      if (eventDate < now) {
        cacheTime = 31536000 * 10
      }
    }

    const filename = `${slugifyEventFilename(event.name)}.ics`
    const body = buildVCalendar([event], {
      name: event.name,
    })

    const cacheControl =
      cacheTime > 31536000
        ? 'public, max-age=31536000, s-maxage=31536000, immutable'
        : `public, max-age=${cacheTime}, s-maxage=${cacheTime}, stale-while-revalidate=${cacheTime}`

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': ICS_CONTENT_TYPE,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': cacheControl,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  } catch (error) {
    console.error('Error generating event calendar file:', error)
    return new NextResponse('Failed to generate calendar file', {
      status: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }
}

import { NextResponse } from 'next/server'
import { buildVCalendar, slugifyEventFilename } from '@/lib/calendar-ics'
import {
  buildEventDetailCacheControl,
  getEventDetailCacheSeconds,
  validateEventDetailApiAccess,
} from '@/lib/event-api-access'
import { formatEventDisplayName } from '@/lib/event-utils'
import { isValidFacebookEventId } from '@/lib/event-id'
import { getEventById, getPastEventIdsFromFiles } from '@/lib/facebook-api'

export const revalidate = 21600 // FACEBOOK_EVENTS_REVALIDATE_SECONDS

const ICS_CONTENT_TYPE = 'text/calendar; charset=utf-8'

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

    const access = validateEventDetailApiAccess(event)
    if (!access.ok) {
      return new NextResponse(access.message, {
        status: access.status,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      })
    }

    const filename = `${slugifyEventFilename(event.name)}.ics`
    const body = buildVCalendar([event], {
      name: formatEventDisplayName(event),
    })

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': ICS_CONTENT_TYPE,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': buildEventDetailCacheControl(
          getEventDetailCacheSeconds(event)
        ),
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

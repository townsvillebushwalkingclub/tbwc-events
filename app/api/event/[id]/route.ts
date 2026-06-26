import { NextResponse } from 'next/server'
import {
  buildEventDetailCacheControl,
  getEventDetailCacheSeconds,
  validateEventDetailApiAccess,
} from '@/lib/event-api-access'
import { getEventById, getPastEventIdsFromFiles } from '@/lib/facebook-api'
import { isValidFacebookEventId } from '@/lib/event-id'

export const revalidate = 21600 // FACEBOOK_EVENTS_REVALIDATE_SECONDS

/** Prerender API responses for past event IDs (they won't change). */
export async function generateStaticParams() {
  const ids = getPastEventIdsFromFiles()
  return ids.map((id) => ({ id }))
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Event ID is required' },
        { status: 400 }
      )
    }

    if (!isValidFacebookEventId(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid event ID format' },
        { status: 400 }
      )
    }

    const event = await getEventById(id)

    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      )
    }

    const access = validateEventDetailApiAccess(event)
    if (!access.ok) {
      return NextResponse.json(
        { success: false, error: access.message },
        { status: access.status }
      )
    }

    const cacheTime = getEventDetailCacheSeconds(event)

    const response = NextResponse.json({
      success: true,
      data: event,
      timestamp: new Date().toISOString(),
    })

    response.headers.set(
      'Cache-Control',
      buildEventDetailCacheControl(cacheTime)
    )

    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type')

    return response
  } catch (error) {
    console.error('Error fetching event:', error)
    const errorResponse = NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
    errorResponse.headers.set('Access-Control-Allow-Origin', '*')
    errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
    errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type')
    return errorResponse
  }
}

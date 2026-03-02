import { NextResponse } from 'next/server'
import { getEventById, getPastEventIdsFromFiles } from '@/lib/facebook-api'

export const revalidate = 86400

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

    if (!/^\d{15,16}$/.test(id)) {
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

    if (event.start_time) {
      const now = new Date()
      const minYear = 2019
      const eventDate = new Date(event.start_time)
      const maxFutureDate = new Date(
        now.getFullYear(),
        now.getMonth() + 4,
        0
      )

      if (eventDate.getFullYear() < minYear) {
        return NextResponse.json(
          {
            success: false,
            error: `Events before ${minYear} are not available`,
          },
          { status: 403 }
        )
      }

      if (eventDate > maxFutureDate) {
        return NextResponse.json(
          {
            success: false,
            error:
              'Events more than 3 months in the future are not available',
          },
          { status: 403 }
        )
      }
    }

    let cacheTime = 86400
    if (event.start_time) {
      const now = new Date()
      const eventDate = new Date(event.start_time)
      now.setHours(0, 0, 0, 0)
      eventDate.setHours(0, 0, 0, 0)
      if (eventDate < now) {
        cacheTime = 31536000 * 10
      }
    }

    const response = NextResponse.json({
      success: true,
      data: event,
      timestamp: new Date().toISOString(),
    })

    if (cacheTime > 31536000) {
      response.headers.set(
        'Cache-Control',
        'public, max-age=31536000, s-maxage=31536000, immutable'
      )
    } else {
      response.headers.set(
        'Cache-Control',
        `public, max-age=${cacheTime}, s-maxage=${cacheTime}, stale-while-revalidate=${cacheTime}`
      )
    }

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

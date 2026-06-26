import { NextResponse } from 'next/server'
import { getFacebookEvents } from '@/lib/facebook-api'
import { FACEBOOK_EVENTS_REVALIDATE_SECONDS } from '@/lib/cache-constants'

export const revalidate = 21600 // FACEBOOK_EVENTS_REVALIDATE_SECONDS

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

export async function GET() {
  try {
    const events = await getFacebookEvents()
    const now = new Date()
    const minYear = 2022
    const maxFutureDate = new Date(now.getFullYear(), now.getMonth() + 3, 1)

    const filteredEvents = events.filter((event) => {
      if (!event.start_time) return false
      const eventDate = new Date(event.start_time)
      return (
        eventDate.getFullYear() >= minYear && eventDate < maxFutureDate
      )
    })

    const response = NextResponse.json({
      success: true,
      data: filteredEvents,
      timestamp: new Date().toISOString(),
      cached: true,
    })

    response.headers.set(
      'Cache-Control',
      `public, s-maxage=${FACEBOOK_EVENTS_REVALIDATE_SECONDS}, stale-while-revalidate=${FACEBOOK_EVENTS_REVALIDATE_SECONDS}`
    )
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type')

    return response
  } catch (error) {
    console.error('Error fetching events:', error)
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

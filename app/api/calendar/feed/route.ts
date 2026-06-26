import { NextResponse } from 'next/server'
import {
  buildVCalendar,
  getUpcomingEventsForCalendar,
} from '@/lib/calendar-ics'
import { FACEBOOK_EVENTS_REVALIDATE_SECONDS } from '@/lib/cache-constants'

export const revalidate = 21600 // FACEBOOK_EVENTS_REVALIDATE_SECONDS

const ICS_CONTENT_TYPE = 'text/calendar; charset=utf-8'

function corsHeaders(): HeadersInit {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders(),
  })
}

export async function GET() {
  try {
    const events = await getUpcomingEventsForCalendar()
    const body = buildVCalendar(events, { includeLeaderInitial: true })

    const response = new NextResponse(body, {
      status: 200,
      headers: {
        ...corsHeaders(),
        'Content-Type': ICS_CONTENT_TYPE,
        'Content-Disposition': 'inline; filename="tbwc-events.ics"',
        'Cache-Control':
          `public, s-maxage=${FACEBOOK_EVENTS_REVALIDATE_SECONDS}, stale-while-revalidate=${FACEBOOK_EVENTS_REVALIDATE_SECONDS}`,
      },
    })

    return response
  } catch (error) {
    console.error('Error generating calendar feed:', error)
    return new NextResponse('Failed to generate calendar feed', {
      status: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }
}

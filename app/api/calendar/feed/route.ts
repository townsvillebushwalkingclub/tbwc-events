import { NextResponse } from 'next/server'
import {
  buildVCalendar,
  getUpcomingEventsForCalendar,
} from '@/lib/calendar-ics'

export const revalidate = 21600

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
    const body = buildVCalendar(events)

    const response = new NextResponse(body, {
      status: 200,
      headers: {
        ...corsHeaders(),
        'Content-Type': ICS_CONTENT_TYPE,
        'Content-Disposition': 'inline; filename="tbwc-events.ics"',
        'Cache-Control':
          'public, s-maxage=21600, stale-while-revalidate=21600',
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

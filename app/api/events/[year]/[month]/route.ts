import { NextResponse } from 'next/server'
import {
  getEventsForMonth,
  getPastYearMonthsFromFiles,
} from '@/lib/facebook-api'
import { FACEBOOK_EVENTS_REVALIDATE_SECONDS } from '@/lib/cache-constants'

export const revalidate = 21600 // FACEBOOK_EVENTS_REVALIDATE_SECONDS

/** Prerender API responses for past year/month (they won't change). */
export async function generateStaticParams() {
  const pairs = getPastYearMonthsFromFiles()
  return pairs.map(({ year, month }) => ({
    year: year.toString(),
    month: month.toString(),
  }))
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
  context: { params: Promise<{ year: string; month: string }> }
) {
  try {
    const { year: yearParam, month: monthParam } = await context.params
    const year = parseInt(yearParam, 10)
    const month = parseInt(monthParam, 10)

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return NextResponse.json(
        { success: false, error: 'Invalid year or month' },
        { status: 400 }
      )
    }

    const now = new Date()
    const minYear = 2022
    const requestedDate = new Date(year, month - 1, 1)
    const maxFutureDate = new Date(now.getFullYear(), now.getMonth() + 3, 1)

    if (year < minYear) {
      return NextResponse.json(
        {
          success: false,
          error: `Events before ${minYear} are not available`,
        },
        { status: 400 }
      )
    }

    if (requestedDate >= maxFutureDate) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Events more than 3 months in the future are not available',
        },
        { status: 400 }
      )
    }

    const events = await getEventsForMonth(year, month)

    const response = NextResponse.json({
      success: true,
      data: events,
      year,
      month,
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

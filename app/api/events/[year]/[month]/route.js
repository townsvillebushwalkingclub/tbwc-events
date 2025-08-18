import { NextResponse } from 'next/server'
import { getEventsForMonth } from '../../../../../lib/facebook-api.js'

// Cache for 1 day with revalidation
export const revalidate = 86400 // 24 hours in seconds

export async function GET(request, { params }) {
    try {
        const { year: yearParam, month: monthParam } = await params
        const year = parseInt(yearParam)
        const month = parseInt(monthParam)

        if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid year or month',
                },
                { status: 400 }
            )
        }

        // Fetch real events from Facebook API
        const events = await getEventsForMonth(year, month)

        const response = NextResponse.json({
            success: true,
            data: events,
            year,
            month,
            timestamp: new Date().toISOString(),
            cached: true,
        })

        // Set cache headers for better caching
        response.headers.set(
            'Cache-Control',
            'public, s-maxage=86400, stale-while-revalidate=86400'
        )

        return response
    } catch (error) {
        console.error('Error fetching events:', error)
        return NextResponse.json(
            {
                success: false,
                error: error.message,
            },
            { status: 500 }
        )
    }
}

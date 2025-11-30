import { NextResponse } from 'next/server'
import { getEventsForMonth } from '@/lib/facebook-api.js'

// Cache for 1 day with revalidation
export const revalidate = 86400 // 24 hours in seconds

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

        // Security: Block requests for dates before 2022 or more than 6 months in the future
        const now = new Date()
        const minYear = 2022
        const requestedDate = new Date(year, month - 1, 1)
        
        // Calculate the date 6 months from now (first day of that month)
        const maxFutureDate = new Date(now.getFullYear(), now.getMonth() + 6, 1)

        if (year < minYear) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Events before ${minYear} are not available`,
                },
                { status: 400 }
            )
        }

        // Block if requested month is beyond 6 months in the future
        if (requestedDate >= maxFutureDate) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Events more than 6 months in the future are not available',
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
        
        // Set CORS headers to allow cross-origin requests
        response.headers.set('Access-Control-Allow-Origin', '*')
        response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type')

        return response
    } catch (error) {
        console.error('Error fetching events:', error)
        const errorResponse = NextResponse.json(
            {
                success: false,
                error: error.message,
            },
            { status: 500 }
        )
        
        // Set CORS headers for error responses too
        errorResponse.headers.set('Access-Control-Allow-Origin', '*')
        errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
        errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type')
        
        return errorResponse
    }
}

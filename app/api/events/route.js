import { NextResponse } from 'next/server'
import { getFacebookEvents } from '../../../lib/facebook-api.js'

// Cache for 1 day with revalidation
export const revalidate = 86400 // 24 hours in seconds

export async function GET() {
    try {
        // Fetch all upcoming events from Facebook API
        const events = await getFacebookEvents()

        const response = NextResponse.json({
            success: true,
            data: events,
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

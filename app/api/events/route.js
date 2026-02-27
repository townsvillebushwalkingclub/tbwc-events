import { NextResponse } from 'next/server'
import { getFacebookEvents } from '@/lib/facebook-api.js'

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

export async function GET() {
    try {
        // Fetch all upcoming events from Facebook API
        const events = await getFacebookEvents()

        // Security: Filter out events before 2022 or more than 3 months in the future
        const now = new Date()
        const minYear = 2022
        // Calculate the date 3 months from now (first day of that month)
        const maxFutureDate = new Date(now.getFullYear(), now.getMonth() + 3, 1)

        const filteredEvents = events.filter((event) => {
            if (!event.start_time) return false
            const eventDate = new Date(event.start_time)
            return eventDate.getFullYear() >= minYear && eventDate < maxFutureDate
        })

        const response = NextResponse.json({
            success: true,
            data: filteredEvents,
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

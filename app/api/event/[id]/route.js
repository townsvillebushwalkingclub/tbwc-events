import { NextResponse } from 'next/server'
import { getEventById } from '@/lib/facebook-api.js'

// Default revalidation - will be adjusted per event
export const revalidate = 86400 // Default: 24 hours

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
        const { id } = await params

        if (!id) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Event ID is required',
                },
                { status: 400 }
            )
        }

        // Fetch event from Facebook API or saved files
        const event = await getEventById(id)

        if (!event) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Event not found',
                },
                { status: 404 }
            )
        }

        // Determine cache time based on event date
        // Past events: Cache forever (immutable) - they won't change
        // Current/future events: Revalidate daily (86400 seconds)
        let cacheTime = 86400 // Default: 1 day for current/future events
        if (event.start_time) {
            const now = new Date()
            const eventDate = new Date(event.start_time)

            // Check if event is in the past
            now.setHours(0, 0, 0, 0)
            eventDate.setHours(0, 0, 0, 0)

            if (eventDate < now) {
                // Past event: Cache forever (immutable)
                cacheTime = 31536000 * 10 // 10 years (effectively forever)
            }
        }

        const response = NextResponse.json({
            success: true,
            data: event,
            timestamp: new Date().toISOString(),
        })

        // Set cache headers with dynamic cache time
        if (cacheTime > 31536000) {
            // Past events: Immutable cache (won't change)
            response.headers.set(
                'Cache-Control',
                'public, max-age=31536000, s-maxage=31536000, immutable'
            )
        } else {
            // Current/future events: Revalidate daily
            response.headers.set(
                'Cache-Control',
                `public, max-age=${cacheTime}, s-maxage=${cacheTime}, stale-while-revalidate=${cacheTime}`
            )
        }

        // Set CORS headers to allow cross-origin requests
        response.headers.set('Access-Control-Allow-Origin', '*')
        response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type')

        return response
    } catch (error) {
        console.error('Error fetching event:', error)
        const errorResponse = NextResponse.json(
            {
                success: false,
                error: error.message,
            },
            { status: 500 }
        )

        // Set CORS headers for error responses too
        errorResponse.headers.set('Access-Control-Allow-Origin', '*')
        errorResponse.headers.set(
            'Access-Control-Allow-Methods',
            'GET, OPTIONS'
        )
        errorResponse.headers.set(
            'Access-Control-Allow-Headers',
            'Content-Type'
        )

        return errorResponse
    }
}

import { NextResponse } from 'next/server'
import { getEventById } from '../../../../lib/facebook-api.js'

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

        const response = NextResponse.json({
            success: true,
            data: event,
            timestamp: new Date().toISOString(),
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
        errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
        errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type')

        return errorResponse
    }
}


import { NextResponse } from 'next/server'
import { getFacebookEvents } from '../../../lib/facebook-api.js'

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

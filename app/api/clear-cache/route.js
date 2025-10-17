import { NextResponse } from 'next/server'
import { clearEventsCache } from '../../../lib/facebook-api'

/**
 * Cache clearing endpoint for development/admin use
 *
 * This endpoint clears the Facebook events cache, forcing
 * the next request to fetch fresh data from Facebook API.
 *
 * Usage:
 *   GET /api/clear-cache
 *   POST /api/clear-cache
 *
 * For security in production, you may want to add authentication
 * or restrict this to specific environments/IPs.
 */
export async function GET() {
    try {
        clearEventsCache()

        return NextResponse.json({
            success: true,
            message: 'Cache cleared successfully',
            timestamp: new Date().toISOString(),
        })
    } catch (error) {
        console.error('Error clearing cache:', error)

        return NextResponse.json(
            {
                success: false,
                message: 'Failed to clear cache',
                error: error.message,
            },
            { status: 500 }
        )
    }
}

// Support POST as well
export async function POST() {
    return GET()
}

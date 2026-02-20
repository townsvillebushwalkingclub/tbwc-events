import { getAllEvents } from '@/lib/facebook-api.js'
import { NextResponse } from 'next/server'

/**
 * GET /api/events/search?q=...
 * Search through all locally cached FB events (API cache + data/events files).
 * Matches event name, description, and place name (case-insensitive).
 */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const q = searchParams.get('q')?.trim() || ''

        if (!q) {
            return NextResponse.json({
                success: true,
                data: [],
                message: 'Provide a search query with ?q=...',
            })
        }

        const allEvents = await getAllEvents()

        const query = q.toLowerCase()
        const matches = allEvents.filter((event) => {
            const name = (event.name || '').toLowerCase()
            const description = (event.description || '').toLowerCase()
            const placeName = (event.place?.name || '').toLowerCase()
            return (
                name.includes(query) ||
                description.includes(query) ||
                placeName.includes(query)
            )
        })

        // Sort by start time (newest first for past, soonest first for future)
        const now = Date.now()
        matches.sort((a, b) => {
            const ta = new Date(a.start_time).getTime()
            const tb = new Date(b.start_time).getTime()
            if (ta >= now && tb >= now) return ta - tb
            if (ta < now && tb < now) return tb - ta
            return ta >= now ? -1 : 1
        })

        return NextResponse.json({
            success: true,
            data: matches,
            count: matches.length,
        })
    } catch (error) {
        console.error('Error searching events:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}

import { getAllEvents } from '@/lib/facebook-api'
import { NextResponse } from 'next/server'
import { FACEBOOK_EVENTS_REVALIDATE_SECONDS } from '@/lib/cache-constants'

export const dynamic = 'force-dynamic'
export const revalidate = 21600 // FACEBOOK_EVENTS_REVALIDATE_SECONDS

export async function GET(request: Request) {
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

    const now = Date.now()
    matches.sort((a, b) => {
      const ta = new Date(a.start_time).getTime()
      const tb = new Date(b.start_time).getTime()
      if (ta >= now && tb >= now) return ta - tb
      if (ta < now && tb < now) return tb - ta
      return ta >= now ? -1 : 1
    })

    const response = NextResponse.json({
      success: true,
      data: matches,
      count: matches.length,
    })
    response.headers.set(
      'Cache-Control',
      `public, s-maxage=${FACEBOOK_EVENTS_REVALIDATE_SECONDS}, stale-while-revalidate=${FACEBOOK_EVENTS_REVALIDATE_SECONDS}`
    )
    return response
  } catch (error) {
    console.error('Error searching events:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

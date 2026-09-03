import { NextResponse } from 'next/server'
import { isCacheClearAuthorized } from '@/lib/cache-auth'
import { clearFacebookEventCaches } from '@/lib/cache-clear'

export const dynamic = 'force-dynamic'

interface ClearCacheBody {
  eventId?: string
  year?: number
  month?: number
}

function parseBody(value: unknown): ClearCacheBody {
  if (!value || typeof value !== 'object') return {}
  const body = value as Record<string, unknown>
  const eventId =
    typeof body.eventId === 'string' && body.eventId.trim()
      ? body.eventId.trim()
      : undefined
  const year =
    typeof body.year === 'number' && Number.isInteger(body.year)
      ? body.year
      : undefined
  const month =
    typeof body.month === 'number' &&
    Number.isInteger(body.month) &&
    body.month >= 1 &&
    body.month <= 12
      ? body.month
      : undefined
  return { eventId, year, month }
}

export async function POST(request: Request) {
  if (!process.env.CACHE_CLEAR_SECRET && process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      {
        success: false,
        error: 'CACHE_CLEAR_SECRET is not configured',
      },
      { status: 503 }
    )
  }

  if (!isCacheClearAuthorized(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const body = parseBody(await request.json().catch(() => null))
  const result = await clearFacebookEventCaches(body)

  return NextResponse.json({
    success: true,
    message: 'Facebook event caches cleared',
    ...result,
    timestamp: new Date().toISOString(),
  })
}

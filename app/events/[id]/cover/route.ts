import { NextResponse } from 'next/server'
import { getCoverFromManifest } from '@/lib/event-cover-manifest'
import { isValidFacebookEventId } from '@/lib/event-id'
import { getEventById } from '@/lib/facebook-api'
import { absoluteEventShareImageUrl } from '@/lib/site'

const COVER_CACHE_CONTROL = 'public, max-age=86400, s-maxage=604800'
const FETCH_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
}

async function streamImage(url: string): Promise<NextResponse | null> {
  try {
    const res = await fetch(url, { headers: FETCH_HEADERS })
    if (!res.ok || !res.body) return null
    const contentType = res.headers.get('content-type') || 'image/jpeg'
    if (!contentType.startsWith('image/')) return null
    return new NextResponse(res.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': COVER_CACHE_CONTROL,
      },
    })
  } catch {
    return null
  }
}

function isFacebookCdnHost(hostname: string): boolean {
  return hostname === 'fbcdn.net' || hostname.endsWith('.fbcdn.net')
}

function resolveRemoteCoverUrl(source: string): string | null {
  const trimmed = source.trim()
  if (trimmed.startsWith('/event-covers/')) {
    return absoluteEventShareImageUrl(trimmed)
  }
  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol === 'https:' && isFacebookCdnHost(parsed.hostname)) {
      return parsed.href
    }
  } catch {
    return null
  }
  return null
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  if (!id || !isValidFacebookEventId(id)) {
    return new NextResponse('Not found', { status: 404 })
  }

  const fromManifest = getCoverFromManifest(id)
  if (fromManifest) {
    const url = absoluteEventShareImageUrl(fromManifest.path)
    if (url) {
      const streamed = await streamImage(url)
      if (streamed) return streamed
    }
  }

  const event = await getEventById(id)
  const source = event?.cover?.source
  if (!source) {
    return new NextResponse('Not found', { status: 404 })
  }

  const url = resolveRemoteCoverUrl(source)
  if (!url) {
    return new NextResponse('Not found', { status: 404 })
  }

  const streamed = await streamImage(url)
  if (streamed) return streamed
  return new NextResponse('Not found', { status: 404 })
}

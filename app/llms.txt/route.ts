import { NextResponse } from 'next/server'
import { buildLlmsTxt, generateLlmsTxt } from '@/lib/llms-txt'
import { FACEBOOK_EVENTS_REVALIDATE_SECONDS } from '@/lib/cache-constants'

export const revalidate = 21600 // FACEBOOK_EVENTS_REVALIDATE_SECONDS

const PLAIN_TEXT_HEADERS = {
  'Content-Type': 'text/plain; charset=utf-8',
  'Cache-Control': `public, s-maxage=${FACEBOOK_EVENTS_REVALIDATE_SECONDS}, stale-while-revalidate=${FACEBOOK_EVENTS_REVALIDATE_SECONDS}`,
} as const

export async function GET() {
  try {
    const body = await generateLlmsTxt()
    return new NextResponse(body, { headers: PLAIN_TEXT_HEADERS })
  } catch (error) {
    console.error('Error generating llms.txt:', error)
    const body = buildLlmsTxt([])
    return new NextResponse(body, { headers: PLAIN_TEXT_HEADERS })
  }
}

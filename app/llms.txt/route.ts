import { NextResponse } from 'next/server'
import { buildLlmsTxt, generateLlmsTxt } from '@/lib/llms-txt'

export const revalidate = 21600

const PLAIN_TEXT_HEADERS = {
  'Content-Type': 'text/plain; charset=utf-8',
  'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=21600',
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

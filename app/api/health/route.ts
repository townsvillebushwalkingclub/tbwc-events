import { NextResponse } from 'next/server'

export const revalidate = 60 // 1 minute

export async function GET() {
  const response = NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  })
  response.headers.set(
    'Cache-Control',
    'public, s-maxage=60, stale-while-revalidate=60'
  )
  return response
}

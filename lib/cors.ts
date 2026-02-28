/**
 * CORS configuration utility
 *
 * Configure allowed origins via environment variable:
 * CORS_ALLOWED_ORIGINS=https://townsvillebushwalkingclub.com,https://www.townsvillebushwalkingclub.com
 *
 * If not set, defaults to allowing all origins (*) for backward compatibility
 */

function getAllowedOrigins(): string[] | null {
  const envOrigins = process.env.CORS_ALLOWED_ORIGINS
  if (!envOrigins) return null
  return envOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0)
}

function isOriginAllowed(
  origin: string,
  allowedOrigins: string[] | null
): boolean {
  if (!allowedOrigins) return true
  return allowedOrigins.includes(origin)
}

export function getCorsHeaders(request: Request): Record<string, string> {
  const allowedOrigins = getAllowedOrigins()
  const requestOrigin = request.headers.get('origin')

  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  if (allowedOrigins) {
    if (requestOrigin && isOriginAllowed(requestOrigin, allowedOrigins)) {
      headers['Access-Control-Allow-Origin'] = requestOrigin
      headers['Access-Control-Allow-Credentials'] = 'true'
    }
  } else {
    headers['Access-Control-Allow-Origin'] = '*'
  }
  return headers
}

export function createCorsOptionsResponse(request: Request) {
  const { NextResponse } = require('next/server')
  const headers = getCorsHeaders(request)
  return new NextResponse(null, { status: 200, headers })
}

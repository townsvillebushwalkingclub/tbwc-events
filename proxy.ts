import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const rateLimitStore = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000
const RATE_LIMIT_MAX_REQUESTS = 40

function getClientIP(request: NextRequest): string {
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  const realIP = request.headers.get('x-real-ip')
  const forwarded = request.headers.get('x-forwarded-for')
  if (cfConnectingIP) return cfConnectingIP
  if (realIP) return realIP
  if (forwarded) return forwarded.split(',')[0].trim()
  return (request as NextRequest & { ip?: string }).ip || 'unknown'
}

function checkRateLimit(ip: string): {
  allowed: boolean
  remaining: number
  resetTime?: number
} {
  const now = Date.now()
  const key = `rate_limit_${ip}`
  const record = rateLimitStore.get(key)

  if (!record) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    })
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 }
  }
  if (now > record.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    })
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 }
  }
  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
    }
  }
  record.count++
  rateLimitStore.set(key, record)
  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX_REQUESTS - record.count,
  }
}

function cleanupRateLimitStore(): void {
  const now = Date.now()
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) rateLimitStore.delete(key)
  }
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const response = NextResponse.next()

  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com https://static.cloudflareinsights.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://graph.facebook.com https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://*.g.doubleclick.net https://*.google.com",
    "frame-ancestors 'none'",
  ].join('; ')
  response.headers.set('Content-Security-Policy', csp)

  if (
    pathname.startsWith('/events/') ||
    pathname.startsWith('/api/event/') ||
    pathname.startsWith('/api/events/') ||
    pathname === '/api/events'
  ) {
    if (Math.random() < 0.01) cleanupRateLimitStore()
    const ip = getClientIP(request)
    const rateLimit = checkRateLimit(ip)

    if (!rateLimit.allowed && rateLimit.resetTime !== undefined) {
      const rateLimitResponse = NextResponse.json(
        {
          success: false,
          error: 'Too many requests. Please try again later.',
        },
        { status: 429 }
      )
      response.headers.forEach((value, key) => {
        rateLimitResponse.headers.set(key, value)
      })
      rateLimitResponse.headers.set('X-RateLimit-Limit', RATE_LIMIT_MAX_REQUESTS.toString())
      rateLimitResponse.headers.set('X-RateLimit-Remaining', '0')
      rateLimitResponse.headers.set(
        'X-RateLimit-Reset',
        new Date(rateLimit.resetTime).toISOString()
      )
      rateLimitResponse.headers.set(
        'Retry-After',
        Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString()
      )
      return rateLimitResponse
    }

    response.headers.set('X-RateLimit-Limit', RATE_LIMIT_MAX_REQUESTS.toString())
    response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString())
  }

  return response
}

export const config = {
  matcher: [
    '/events/:path*',
    '/api/event/:path*',
    '/api/events/:path*',
    '/api/events',
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

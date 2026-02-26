import { NextResponse } from 'next/server'

// Simple in-memory rate limiting store
// In production, consider using Redis or a database for distributed rate limiting
const rateLimitStore = new Map()

// Rate limit configuration
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute in milliseconds
const RATE_LIMIT_MAX_REQUESTS = 30 // Max requests per window per IP

/**
 * Get client IP address from request
 */
function getClientIP(request) {
    // Check various headers for the real IP (useful behind proxies/load balancers)
    const forwarded = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    const cfConnectingIP = request.headers.get('cf-connecting-ip') // Cloudflare
    
    if (cfConnectingIP) return cfConnectingIP
    if (realIP) return realIP
    if (forwarded) return forwarded.split(',')[0].trim()
    
    // Fallback (may not work in all environments)
    return request.ip || 'unknown'
}

/**
 * Check if request should be rate limited
 */
function checkRateLimit(ip) {
    const now = Date.now()
    const key = `rate_limit_${ip}`
    
    const record = rateLimitStore.get(key)
    
    if (!record) {
        // First request from this IP
        rateLimitStore.set(key, {
            count: 1,
            resetTime: now + RATE_LIMIT_WINDOW,
        })
        return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 }
    }
    
    // Check if window has expired
    if (now > record.resetTime) {
        // Reset the window
        rateLimitStore.set(key, {
            count: 1,
            resetTime: now + RATE_LIMIT_WINDOW,
        })
        return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 }
    }
    
    // Check if limit exceeded
    if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
        return {
            allowed: false,
            remaining: 0,
            resetTime: record.resetTime,
        }
    }
    
    // Increment count
    record.count++
    rateLimitStore.set(key, record)
    
    return {
        allowed: true,
        remaining: RATE_LIMIT_MAX_REQUESTS - record.count,
    }
}

/**
 * Clean up old rate limit entries periodically
 * Called during rate limit checks to prevent memory leaks
 */
function cleanupRateLimitStore() {
    const now = Date.now()
    for (const [key, record] of rateLimitStore.entries()) {
        if (now > record.resetTime) {
            rateLimitStore.delete(key)
        }
    }
}

export async function proxy(request) {
    const pathname = request.nextUrl.pathname
    const response = NextResponse.next()
    
    // Add security headers to all responses
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    
    // Content Security Policy - adjust based on your needs
    // Allow inline styles/scripts for Next.js, but restrict external sources
    const csp = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://static.cloudflareinsights.com", // Next.js, GA, Cloudflare Web Analytics
        "style-src 'self' 'unsafe-inline'", // Tailwind and inline styles
        "img-src 'self' data: https: blob:", // Images from various sources
        "font-src 'self' data:",
        "connect-src 'self' https://graph.facebook.com https://www.google-analytics.com", // API calls
        "frame-ancestors 'none'",
    ].join('; ')
    response.headers.set('Content-Security-Policy', csp)
    
    // Apply rate limiting to event routes and API routes
    if (
        pathname.startsWith('/events/') || 
        pathname.startsWith('/api/event/') ||
        pathname.startsWith('/api/events/') ||
        pathname === '/api/events'
    ) {
        // Clean up expired entries periodically (every 100 requests roughly)
        if (Math.random() < 0.01) {
            cleanupRateLimitStore()
        }
        
        const ip = getClientIP(request)
        const rateLimit = checkRateLimit(ip)
        
        if (!rateLimit.allowed) {
            const rateLimitResponse = NextResponse.json(
                {
                    success: false,
                    error: 'Too many requests. Please try again later.',
                },
                { status: 429 }
            )
            
            // Copy security headers
            response.headers.forEach((value, key) => {
                rateLimitResponse.headers.set(key, value)
            })
            
            // Add rate limit headers
            rateLimitResponse.headers.set('X-RateLimit-Limit', RATE_LIMIT_MAX_REQUESTS.toString())
            rateLimitResponse.headers.set('X-RateLimit-Remaining', '0')
            rateLimitResponse.headers.set(
                'X-RateLimit-Reset',
                new Date(rateLimit.resetTime).toISOString()
            )
            rateLimitResponse.headers.set('Retry-After', Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString())
            
            return rateLimitResponse
        }
        
        // Add rate limit headers to successful requests
        response.headers.set('X-RateLimit-Limit', RATE_LIMIT_MAX_REQUESTS.toString())
        response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString())
    }
    
    return response
}

// Configure which routes the proxy should run on
export const config = {
    matcher: [
        '/events/:path*',
        '/api/event/:path*',
        '/api/events/:path*',
        '/api/events',
        // Exclude static files and Next.js internals
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}



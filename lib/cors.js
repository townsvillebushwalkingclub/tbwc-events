/**
 * CORS configuration utility
 * 
 * Configure allowed origins via environment variable:
 * CORS_ALLOWED_ORIGINS=https://townsvillebushwalkingclub.com,https://www.townsvillebushwalkingclub.com
 * 
 * If not set, defaults to allowing all origins (*) for backward compatibility
 */

/**
 * Get allowed origins from environment variable
 */
function getAllowedOrigins() {
    const envOrigins = process.env.CORS_ALLOWED_ORIGINS
    if (!envOrigins) {
        return null // null means allow all (*)
    }
    
    return envOrigins
        .split(',')
        .map(origin => origin.trim())
        .filter(origin => origin.length > 0)
}

/**
 * Check if an origin is allowed
 */
function isOriginAllowed(origin, allowedOrigins) {
    if (!allowedOrigins) {
        return true // Allow all if not configured
    }
    
    return allowedOrigins.includes(origin)
}

/**
 * Get CORS headers for a request
 * @param {Request} request - The incoming request
 * @returns {Object} Headers object with CORS headers
 */
export function getCorsHeaders(request) {
    const allowedOrigins = getAllowedOrigins()
    const requestOrigin = request.headers.get('origin')
    
    const headers = {
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    }
    
    if (allowedOrigins) {
        // Restrict to specific origins
        if (requestOrigin && isOriginAllowed(requestOrigin, allowedOrigins)) {
            headers['Access-Control-Allow-Origin'] = requestOrigin
            headers['Access-Control-Allow-Credentials'] = 'true'
        }
        // If origin doesn't match, don't set Access-Control-Allow-Origin
        // This effectively blocks the request
    } else {
        // Allow all origins (backward compatibility)
        headers['Access-Control-Allow-Origin'] = '*'
    }
    
    return headers
}

/**
 * Create a CORS-enabled OPTIONS response
 * @param {Request} request - The incoming request
 * @returns {NextResponse} Response with CORS headers
 */
export function createCorsOptionsResponse(request) {
    const { NextResponse } = require('next/server')
    const headers = getCorsHeaders(request)
    
    return new NextResponse(null, {
        status: 200,
        headers,
    })
}


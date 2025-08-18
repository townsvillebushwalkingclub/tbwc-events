import { NextResponse } from 'next/server'

export async function GET() {
    return NextResponse.json({
        success: true,
        message: 'Test API working',
        env: {
            hasToken: !!process.env.FACEBOOK_ACCESS_TOKEN,
            tokenLength: process.env.FACEBOOK_ACCESS_TOKEN
                ? process.env.FACEBOOK_ACCESS_TOKEN.length
                : 0,
        },
        timestamp: new Date().toISOString(),
    })
}

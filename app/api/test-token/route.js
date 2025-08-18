import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const token = process.env.FACEBOOK_ACCESS_TOKEN

        if (!token) {
            return NextResponse.json({
                success: false,
                error: 'No Facebook access token found',
            })
        }

        // Test the token with a simple API call
        const response = await fetch(
            `https://graph.facebook.com/v19.0/townsvillebushwalkingclub?access_token=${token}&fields=id,name`
        )

        const data = await response.json()

        if (response.ok) {
            return NextResponse.json({
                success: true,
                message: 'Token is valid!',
                pageInfo: data,
                timestamp: new Date().toISOString(),
            })
        } else {
            return NextResponse.json({
                success: false,
                error: 'Token validation failed',
                facebookError: data,
                timestamp: new Date().toISOString(),
            })
        }
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString(),
        })
    }
}

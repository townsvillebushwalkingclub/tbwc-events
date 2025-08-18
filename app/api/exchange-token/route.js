import { NextResponse } from 'next/server'

export async function POST(request) {
    try {
        const { appId, appSecret, shortLivedToken } = await request.json()

        if (!appId || !appSecret || !shortLivedToken) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Missing required parameters: appId, appSecret, shortLivedToken',
                },
                { status: 400 }
            )
        }

        const url = `https://graph.facebook.com/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`

        const response = await fetch(url)
        const data = await response.json()

        if (data.access_token) {
            return NextResponse.json({
                success: true,
                access_token: data.access_token,
                expires_in: data.expires_in,
                expires_in_days: Math.round(data.expires_in / 86400),
                message: 'Long-lived token obtained successfully!',
            })
        } else {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Failed to exchange token',
                    facebookError: data,
                },
                { status: 400 }
            )
        }
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                error: error.message,
            },
            { status: 500 }
        )
    }
}

import { NextResponse } from 'next/server'

export async function GET() {
    try {
        // Check if environment variable is available
        const hasToken = !!process.env.FACEBOOK_ACCESS_TOKEN
        const tokenLength = process.env.FACEBOOK_ACCESS_TOKEN
            ? process.env.FACEBOOK_ACCESS_TOKEN.length
            : 0

        // Test 1: Try with username
        let test1 = 'Not tested'
        try {
            const response1 = await fetch(
                'https://graph.facebook.com/v23.0/townsvillebushwalkingclub?access_token=' +
                    process.env.FACEBOOK_ACCESS_TOKEN +
                    '&fields=id,name'
            )
            const data1 = await response1.json()
            test1 = response1.ok
                ? `Success: ${JSON.stringify(data1)}`
                : `Failed: ${response1.status} - ${JSON.stringify(data1)}`
        } catch (error) {
            test1 = `Error: ${error.message}`
        }

        // Test 2: Try to get page ID first
        let test2 = 'Not tested'
        try {
            const response2 = await fetch(
                'https://graph.facebook.com/v23.0/townsvillebushwalkingclub?access_token=' +
                    process.env.FACEBOOK_ACCESS_TOKEN
            )
            const data2 = await response2.json()
            test2 = response2.ok
                ? `Success: ${JSON.stringify(data2)}`
                : `Failed: ${response2.status} - ${JSON.stringify(data2)}`
        } catch (error) {
            test2 = `Error: ${error.message}`
        }

        // Test 3: Try with events endpoint
        let test3 = 'Not tested'
        try {
            const response3 = await fetch(
                'https://graph.facebook.com/v23.0/townsvillebushwalkingclub/events?access_token=' +
                    process.env.FACEBOOK_ACCESS_TOKEN +
                    '&fields=id,name&limit=5'
            )
            const data3 = await response3.json()
            test3 = response3.ok
                ? `Success: ${JSON.stringify(data3)}`
                : `Failed: ${response3.status} - ${JSON.stringify(data3)}`
        } catch (error) {
            test3 = `Error: ${error.message}`
        }

        return NextResponse.json({
            success: true,
            hasToken,
            tokenLength,
            test1,
            test2,
            test3,
            timestamp: new Date().toISOString(),
        })
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString(),
            },
            { status: 500 }
        )
    }
}

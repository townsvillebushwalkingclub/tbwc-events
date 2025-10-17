/**
 * Script to exchange short-lived Facebook token for long-lived token
 *
 * Facebook Token Lifespan:
 * - Short-lived User Access Tokens: ~1-2 hours
 * - Long-lived User Access Tokens: ~60 days
 * - Page Access Tokens (from long-lived user token): Never expire (unless permissions revoked)
 *
 * Usage:
 * 1. Get a short-lived token from Facebook Graph API Explorer:
 *    https://developers.facebook.com/tools/explorer/
 * 2. Add FACEBOOK_APP_ID, FACEBOOK_APP_SECRET, and FACEBOOK_ACCESS_TOKEN to .env.local file
 * 3. Run: node get-long-lived-token.js
 * 4. Update your environment variables with the new token
 *
 * For production (Vercel/hosting):
 * - Update the FACEBOOK_ACCESS_TOKEN environment variable with the new long-lived token
 * - The token should last ~60 days
 * - Set a reminder to refresh it before expiration
 */

const fs = require('fs')
const path = require('path')
const https = require('https')

// Load environment variables from .env or .env.local file
function loadEnvFile() {
    const envFiles = ['.env.local', '.env']

    for (const envFile of envFiles) {
        const envPath = path.join(__dirname, envFile)
        if (fs.existsSync(envPath)) {
            console.log(`📄 Loading environment from ${envFile}`)
            const envContent = fs.readFileSync(envPath, 'utf8')
            const envVars = {}

            envContent.split('\n').forEach((line) => {
                const [key, ...valueParts] = line.split('=')
                if (key && valueParts.length > 0) {
                    envVars[key.trim()] = valueParts.join('=').trim()
                }
            })

            return { envVars, envFile }
        }
    }
    return { envVars: {}, envFile: null }
}

const { envVars: env, envFile } = loadEnvFile()
const FACEBOOK_APP_ID = env.FACEBOOK_APP_ID
const FACEBOOK_APP_SECRET = env.FACEBOOK_APP_SECRET
const SHORT_LIVED_TOKEN = env.FACEBOOK_ACCESS_TOKEN
const FACEBOOK_PAGE_ID = env.FACEBOOK_PAGE_ID

function makeRequest(url) {
    return new Promise((resolve, reject) => {
        https
            .get(url, (res) => {
                let data = ''

                res.on('data', (chunk) => {
                    data += chunk
                })

                res.on('end', () => {
                    try {
                        const jsonData = JSON.parse(data)
                        resolve(jsonData)
                    } catch (error) {
                        reject(new Error('Failed to parse response'))
                    }
                })
            })
            .on('error', (error) => {
                reject(error)
            })
    })
}

async function getPageAccessToken(userAccessToken) {
    try {
        console.log('\n🔍 Fetching page access token (never expires)...')
        const url = `https://graph.facebook.com/v23.0/me/accounts?access_token=${userAccessToken}`
        const data = await makeRequest(url)

        if (data.data && data.data.length > 0) {
            // If FACEBOOK_PAGE_ID is set, find that specific page
            let pageData = null
            if (FACEBOOK_PAGE_ID) {
                pageData = data.data.find(
                    (page) => page.id === FACEBOOK_PAGE_ID
                )
                if (!pageData) {
                    console.log(
                        `⚠️  Page with ID ${FACEBOOK_PAGE_ID} not found`
                    )
                    console.log('📋 Available pages:')
                    data.data.forEach((page) => {
                        console.log(`   - ${page.name} (ID: ${page.id})`)
                    })
                    pageData = data.data[0]
                }
            } else {
                pageData = data.data[0]
            }

            console.log(`✅ Page Access Token obtained for: ${pageData.name}`)
            console.log('📝 Page Access Token:', pageData.access_token)
            console.log(
                '🎉 This token NEVER EXPIRES (unless permissions are revoked)!'
            )
            console.log('\n🔧 Update your environment variables with:')
            console.log(`FACEBOOK_ACCESS_TOKEN=${pageData.access_token}`)
            console.log(`FACEBOOK_PAGE_ID=${pageData.id}`)

            return pageData.access_token
        } else {
            console.log('⚠️  No pages found for this user token')
            console.log(
                '💡 Make sure you have admin access to the Facebook page'
            )
            return null
        }
    } catch (error) {
        console.error('❌ Error getting page access token:', error.message)
        return null
    }
}

async function getLongLivedToken() {
    try {
        console.log(
            '🔄 Step 1: Exchanging short-lived token for long-lived user token...'
        )
        const url = `https://graph.facebook.com/oauth/access_token?grant_type=fb_exchange_token&client_id=${FACEBOOK_APP_ID}&client_secret=${FACEBOOK_APP_SECRET}&fb_exchange_token=${SHORT_LIVED_TOKEN}`

        const data = await makeRequest(url)

        if (data.access_token) {
            console.log('✅ Long-lived user token obtained successfully!')
            console.log(
                '⏰ User token expires in:',
                data.expires_in,
                'seconds (',
                Math.round(data.expires_in / 86400),
                'days)'
            )

            // Now try to get a page access token which never expires
            const pageToken = await getPageAccessToken(data.access_token)

            if (!pageToken) {
                console.log(
                    '\n⚠️  Could not get page access token, using user token instead'
                )
                console.log('📝 User Access Token:', data.access_token)
                console.log('\n🔧 Update your environment with:')
                console.log(`FACEBOOK_ACCESS_TOKEN=${data.access_token}`)
                console.log(
                    '\n⏰ REMINDER: Set a reminder to refresh this token in ~60 days'
                )
            }

            if (envFile) {
                console.log(
                    `\n💾 You can update your ${envFile} file with the new token`
                )
            } else {
                console.log('\n💾 Create a .env.local file with the new token')
            }
        } else {
            console.error('❌ Failed to get long-lived token:', data)
        }
    } catch (error) {
        console.error('❌ Error:', error.message)
        console.log('\n💡 Troubleshooting:')
        console.log('   1. Make sure your short-lived token is valid')
        console.log('   2. Check that your App ID and App Secret are correct')
        console.log('   3. Ensure the token has the required permissions:')
        console.log('      - pages_read_engagement')
        console.log('      - pages_show_list')
    }
}

// Check if required values are set
if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET || !SHORT_LIVED_TOKEN) {
    console.log('❌ Missing required environment variables')
    console.log('\n📝 Please create a .env.local file with:')
    console.log('FACEBOOK_APP_ID=your_app_id')
    console.log('FACEBOOK_APP_SECRET=your_app_secret')
    console.log('FACEBOOK_ACCESS_TOKEN=your_short_lived_token')
    console.log('FACEBOOK_PAGE_ID=your_page_id (optional)')
    console.log('\n📚 How to get these values:')
    console.log('1. App ID & Secret: https://developers.facebook.com/apps/')
    console.log(
        '2. Short-lived token: https://developers.facebook.com/tools/explorer/'
    )
    console.log('   - Select your app')
    console.log('   - Add permissions: pages_read_engagement, pages_show_list')
    console.log('   - Generate Access Token')
    console.log(
        '3. Page ID: Check your Facebook Page settings or About section'
    )
} else {
    console.log('🚀 Starting token refresh process...\n')
    getLongLivedToken()
}

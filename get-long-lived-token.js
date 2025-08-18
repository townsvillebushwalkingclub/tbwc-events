/**
 * Script to exchange short-lived Facebook token for long-lived token
 *
 * Usage:
 * 1. Add your FACEBOOK_APP_ID and FACEBOOK_APP_SECRET to the .env file
 * 2. Run: node get-long-lived-token.js
 */

const fs = require('fs')
const path = require('path')
const https = require('https')

// Load environment variables from .env file
function loadEnvFile() {
    const envPath = path.join(__dirname, '.env')
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8')
        const envVars = {}

        envContent.split('\n').forEach((line) => {
            const [key, ...valueParts] = line.split('=')
            if (key && valueParts.length > 0) {
                envVars[key.trim()] = valueParts.join('=').trim()
            }
        })

        return envVars
    }
    return {}
}

const env = loadEnvFile()
const FACEBOOK_APP_ID = env.FACEBOOK_APP_ID
const FACEBOOK_APP_SECRET = env.FACEBOOK_APP_SECRET
const SHORT_LIVED_TOKEN = env.FACEBOOK_ACCESS_TOKEN

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

async function getLongLivedToken() {
    try {
        const url = `https://graph.facebook.com/oauth/access_token?grant_type=fb_exchange_token&client_id=${FACEBOOK_APP_ID}&client_secret=${FACEBOOK_APP_SECRET}&fb_exchange_token=${SHORT_LIVED_TOKEN}`

        console.log('Exchanging token...')
        const data = await makeRequest(url)

        if (data.access_token) {
            console.log('✅ Long-lived token obtained successfully!')
            console.log('📝 New token:', data.access_token)
            console.log(
                '⏰ Expires in:',
                data.expires_in,
                'seconds (',
                Math.round(data.expires_in / 86400),
                'days)'
            )
            console.log('\n🔧 Update your .env.local file with this new token:')
            console.log(`FACEBOOK_ACCESS_TOKEN=${data.access_token}`)
        } else {
            console.error('❌ Failed to get long-lived token:', data)
        }
    } catch (error) {
        console.error('❌ Error:', error.message)
    }
}

// Check if required values are set
if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET || !SHORT_LIVED_TOKEN) {
    console.log('❌ Please update the .env file with:')
    console.log('1. FACEBOOK_APP_ID - Your Facebook App ID')
    console.log('2. FACEBOOK_APP_SECRET - Your Facebook App Secret')
    console.log('3. FACEBOOK_ACCESS_TOKEN - Your current short-lived token')
    console.log('\nYou can find these in your Facebook Developer Console.')
} else {
    getLongLivedToken()
}

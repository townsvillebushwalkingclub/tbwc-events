/**
 * Script to download historical events from Facebook API
 * Downloads events from January 2020 to the previous month
 * Handles rate limits and can be resumed
 *
 * Usage:
 *   node download-historical-events.js
 *   or
 *   npm run download:history
 */

const fs = require('fs')
const path = require('path')

// Load environment variables from .env or .env.local file
function loadEnvFile() {
    const envFiles = ['.env.local', '.env']

    for (const envFile of envFiles) {
        const envPath = path.join(process.cwd(), envFile)
        if (fs.existsSync(envPath)) {
            const content = fs.readFileSync(envPath, 'utf8')
            const lines = content.split('\n')

            for (const line of lines) {
                const trimmedLine = line.trim()
                if (trimmedLine && !trimmedLine.startsWith('#')) {
                    const [key, ...valueParts] = trimmedLine.split('=')
                    if (key && valueParts.length > 0) {
                        const value = valueParts.join('=').trim()
                        // Remove quotes if present
                        const cleanValue = value.replace(/^["']|["']$/g, '')
                        process.env[key.trim()] = cleanValue
                    }
                }
            }
            return
        }
    }
}

// Load environment variables
loadEnvFile()

const FACEBOOK_PAGE_ID = process.env.FACEBOOK_PAGE_ID
const FACEBOOK_ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN
const DATA_DIR = path.join(process.cwd(), 'data', 'events')
const PROGRESS_FILE = path.join(process.cwd(), 'data', 'download-progress.json')

// Timezone configuration for Brisbane, Australia
const BRISBANE_TIMEZONE = 'Australia/Brisbane'

// Check for required environment variables
if (!FACEBOOK_ACCESS_TOKEN) {
    console.error('❌ FACEBOOK_ACCESS_TOKEN environment variable is not set')
    process.exit(1)
}

if (!FACEBOOK_PAGE_ID) {
    console.error('❌ FACEBOOK_PAGE_ID environment variable is not set')
    process.exit(1)
}

/**
 * Format event date for display
 */
function formatEventDate(dateString) {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-AU', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: BRISBANE_TIMEZONE,
    })
}

/**
 * Format event time for display
 */
function formatEventTime(dateString) {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-AU', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: BRISBANE_TIMEZONE,
    })
}

/**
 * Format event end time for display
 */
function formatEventEndTime(dateString) {
    if (!dateString) return null
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-AU', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: BRISBANE_TIMEZONE,
    })
}

/**
 * Check if error is due to rate limit
 */
function isRateLimitError(errorData) {
    try {
        const error =
            typeof errorData === 'string' ? JSON.parse(errorData) : errorData
        return (
            error.error &&
            (error.error.code === 4 || // Rate limit error code
                error.error.code === 17 || // User request limit
                error.error.type === 'OAuthException')
        )
    } catch {
        return false
    }
}

/**
 * Check if error is due to token expiration
 */
function isTokenExpiredError(errorData) {
    try {
        const error =
            typeof errorData === 'string' ? JSON.parse(errorData) : errorData
        return (
            error.error &&
            error.error.code === 190 &&
            (error.error.error_subcode === 463 ||
                error.error.error_subcode === 467)
        )
    } catch {
        return false
    }
}

/**
 * Fetch events from Facebook API for a specific month
 */
async function fetchEventsForMonth(year, month) {
    // Calculate the start and end of the month in ISO format
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59)

    // Format dates for Facebook API (Unix timestamp)
    const since = Math.floor(startDate.getTime() / 1000)
    const until = Math.floor(endDate.getTime() / 1000)

    const url = `https://graph.facebook.com/v23.0/${FACEBOOK_PAGE_ID}/events?access_token=${FACEBOOK_ACCESS_TOKEN}&fields=id,name,description,start_time,end_time,place,attending_count,interested_count,cover&limit=100&since=${since}&until=${until}`

    try {
        const response = await fetch(url)

        if (!response.ok) {
            const errorText = await response.text()
            console.error(
                `❌ Facebook API error for ${year}/${month}:`,
                response.status
            )

            // Check for rate limit
            if (response.status === 403 || isRateLimitError(errorText)) {
                const errorData = JSON.parse(errorText)
                console.error('⚠️  Rate limit reached!')
                console.error('Error details:', errorData)
                throw new Error('RATE_LIMIT')
            }

            // Check for token expiration
            if (isTokenExpiredError(errorText)) {
                console.error('❌ Facebook access token has expired!')
                throw new Error('TOKEN_EXPIRED')
            }

            throw new Error(
                `Failed to fetch events: ${response.status} ${response.statusText}`
            )
        }

        const data = await response.json()

        if (!data.data) {
            console.warn(`⚠️  No events data returned for ${year}/${month}`)
            return []
        }

        // Format events for our application
        const formattedEvents = data.data.map((event) => {
            const startDate = new Date(event.start_time)
            const endDate = event.end_time ? new Date(event.end_time) : null

            // Check if end date is different from start date
            const isMultiDay =
                endDate && startDate.toDateString() !== endDate.toDateString()

            return {
                id: event.id,
                name: event.name,
                description: event.description || '',
                start_time: event.start_time,
                end_time: event.end_time,
                formatted_date: formatEventDate(event.start_time),
                formatted_time: formatEventTime(event.start_time),
                formatted_end_time: formatEventEndTime(event.end_time),
                formatted_end_date: event.end_time
                    ? formatEventDate(event.end_time)
                    : null,
                is_multi_day: isMultiDay,
                attending_count: event.attending_count || 0,
                interested_count: event.interested_count || 0,
                place: event.place || null,
                cover: event.cover || null,
            }
        })

        return formattedEvents
    } catch (error) {
        if (
            error.message === 'RATE_LIMIT' ||
            error.message === 'TOKEN_EXPIRED'
        ) {
            throw error
        }
        console.error(`Error fetching events for ${year}/${month}:`, error)
        throw error
    }
}

/**
 * Save events to file
 */
function saveEventsToFile(year, month, events) {
    try {
        const yearDir = path.join(DATA_DIR, year.toString())
        // Create year directory if it doesn't exist
        if (!fs.existsSync(yearDir)) {
            fs.mkdirSync(yearDir, { recursive: true })
        }

        const filePath = path.join(
            yearDir,
            `${month.toString().padStart(2, '0')}.json`
        )
        fs.writeFileSync(filePath, JSON.stringify(events, null, 2), 'utf8')
        console.log(`✅ Saved ${events.length} events to ${filePath}`)
    } catch (error) {
        console.error(
            `Error saving events to file for ${year}/${month}:`,
            error
        )
        throw error
    }
}

/**
 * Load progress from file
 */
function loadProgress() {
    try {
        if (fs.existsSync(PROGRESS_FILE)) {
            const content = fs.readFileSync(PROGRESS_FILE, 'utf8')
            return JSON.parse(content)
        }
    } catch (error) {
        console.error('Error loading progress file:', error)
    }
    return {
        completed: [],
        failed: [],
        lastUpdated: null,
    }
}

/**
 * Save progress to file
 */
function saveProgress(progress) {
    try {
        // Ensure data directory exists
        const dataDir = path.dirname(PROGRESS_FILE)
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true })
        }

        progress.lastUpdated = new Date().toISOString()
        fs.writeFileSync(
            PROGRESS_FILE,
            JSON.stringify(progress, null, 2),
            'utf8'
        )
    } catch (error) {
        console.error('Error saving progress file:', error)
    }
}

/**
 * Check if a month is already completed
 */
function isMonthCompleted(progress, year, month) {
    return progress.completed.some(
        (item) => item.year === year && item.month === month
    )
}

/**
 * Generate list of months to process
 */
function generateMonthList() {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1 // 1-12

    // Start from July 2022 (The start of the TBWC Facebook events)
    const startYear = 2022
    const startMonth = 7

    // End at previous month (current month - 1)
    const endYear = currentMonth === 1 ? currentYear - 1 : currentYear
    const endMonth = currentMonth === 1 ? 12 : currentMonth - 1

    const months = []

    for (let year = startYear; year <= endYear; year++) {
        const monthStart = year === startYear ? startMonth : 1
        const monthEnd = year === endYear ? endMonth : 12

        for (let month = monthStart; month <= monthEnd; month++) {
            months.push({ year, month })
        }
    }

    return months
}

/**
 * Main function
 */
async function main() {
    console.log('🚀 Starting historical events download...\n')

    // Load progress
    const progress = loadProgress()
    console.log(
        `📊 Progress: ${progress.completed.length} months completed, ${progress.failed.length} failed\n`
    )

    // Generate list of months to process
    const monthsToProcess = generateMonthList()
    console.log(
        `📅 Total months to process: ${monthsToProcess.length} (from 2020/01 to previous month)\n`
    )

    // Filter out already completed months
    const remainingMonths = monthsToProcess.filter(
        (item) => !isMonthCompleted(progress, item.year, item.month)
    )

    console.log(`📋 Remaining months to process: ${remainingMonths.length}\n`)

    if (remainingMonths.length === 0) {
        console.log('✅ All months have already been downloaded!')
        return
    }

    let processed = 0
    let saved = 0
    let rateLimited = false

    for (const { year, month } of remainingMonths) {
        try {
            console.log(
                `\n📥 Fetching events for ${year}/${month
                    .toString()
                    .padStart(2, '0')}...`
            )

            // Fetch events
            const events = await fetchEventsForMonth(year, month)

            // Save to file
            saveEventsToFile(year, month, events)

            // Update progress
            progress.completed.push({ year, month })
            saveProgress(progress)

            processed++
            saved += events.length

            console.log(
                `✅ Completed ${year}/${month.toString().padStart(2, '0')}: ${
                    events.length
                } events`
            )

            // Add a small delay to avoid hitting rate limits too quickly
            // Wait 1 second between requests
            await new Promise((resolve) => setTimeout(resolve, 1000))
        } catch (error) {
            if (error.message === 'RATE_LIMIT') {
                console.error(`\n⚠️  Rate limit reached at ${year}/${month}`)
                console.error('💾 Progress saved. Please resume tomorrow.')
                rateLimited = true
                break
            } else if (error.message === 'TOKEN_EXPIRED') {
                console.error(`\n❌ Token expired at ${year}/${month}`)
                console.error(
                    'Please update your FACEBOOK_ACCESS_TOKEN and try again.'
                )
                break
            } else {
                console.error(
                    `❌ Error processing ${year}/${month}:`,
                    error.message
                )
                // Mark as failed but continue
                progress.failed.push({ year, month, error: error.message })
                saveProgress(progress)
            }
        }
    }

    // Final summary
    console.log('\n' + '='.repeat(50))
    console.log('📊 Download Summary:')
    console.log(`   Processed: ${processed} months`)
    console.log(`   Events saved: ${saved}`)
    console.log(`   Completed months: ${progress.completed.length}`)
    console.log(`   Failed months: ${progress.failed.length}`)

    if (rateLimited) {
        console.log('\n⚠️  Download stopped due to rate limit.')
        console.log('💾 Progress has been saved.')
        console.log('🔄 Run this script again tomorrow to continue.')
    } else if (remainingMonths.length === processed) {
        console.log('\n✅ All months have been processed!')
    }

    console.log('='.repeat(50))
}

// Run the script
main().catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
})

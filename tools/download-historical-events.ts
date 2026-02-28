/**
 * Script to download historical events from Facebook API
 * Usage: npx tsx tools/download-historical-events.ts
 */

import fs from 'fs'
import path from 'path'
import { downloadCoverImage } from '../lib/download-cover-image'

function loadEnvFile(): void {
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
            const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '')
            process.env[key.trim()] = value
          }
        }
      }
      return
    }
  }
}

loadEnvFile()

const FACEBOOK_PAGE_ID = process.env.FACEBOOK_PAGE_ID
const FACEBOOK_ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN
const DATA_DIR = path.join(process.cwd(), 'data', 'events')
const PROGRESS_FILE = path.join(process.cwd(), 'data', 'download-progress.json')
const BRISBANE_TIMEZONE = 'Australia/Brisbane'

if (!FACEBOOK_ACCESS_TOKEN) {
  console.error('❌ FACEBOOK_ACCESS_TOKEN environment variable is not set')
  process.exit(1)
}
if (!FACEBOOK_PAGE_ID) {
  console.error('❌ FACEBOOK_PAGE_ID environment variable is not set')
  process.exit(1)
}

function formatEventDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-AU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: BRISBANE_TIMEZONE,
  })
}

function formatEventTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleTimeString('en-AU', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: BRISBANE_TIMEZONE,
  })
}

function formatEventEndTime(dateString: string | null): string | null {
  if (!dateString) return null
  const date = new Date(dateString)
  return date.toLocaleTimeString('en-AU', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: BRISBANE_TIMEZONE,
  })
}

function isRateLimitError(errorData: string | unknown): boolean {
  try {
    const error = typeof errorData === 'string' ? JSON.parse(errorData) : errorData
    const err = error as { error?: { code?: number; type?: string } }
    return !!(
      err.error &&
      (err.error.code === 4 || err.error.code === 17 || err.error.type === 'OAuthException')
    )
  } catch {
    return false
  }
}

function isTokenExpiredError(errorData: string | unknown): boolean {
  try {
    const error = typeof errorData === 'string' ? JSON.parse(errorData) : errorData
    const err = error as { error?: { code?: number; error_subcode?: number } }
    return !!(
      err.error &&
      err.error.code === 190 &&
      (err.error.error_subcode === 463 || err.error.error_subcode === 467)
    )
  } catch {
    return false
  }
}

interface RawEvent {
  id: string
  name: string
  description?: string
  start_time: string
  end_time?: string | null
  place?: { name?: string } | null
  attending_count?: number
  interested_count?: number
  cover?: { source: string } | null
}

async function formatEvent(event: RawEvent): Promise<Record<string, unknown>> {
  const startDate = new Date(event.start_time)
  const endDate = event.end_time ? new Date(event.end_time) : null
  const isMultiDay =
    !!endDate && startDate.toDateString() !== endDate.toDateString()

  let cover = event.cover || null
  if (cover?.source) {
    const localPath = await downloadCoverImage(event.id, cover.source)
    if (localPath?.startsWith('/event-covers/')) {
      cover = { ...cover, source: localPath }
    }
  }

  return {
    id: event.id,
    name: event.name,
    description: event.description || '',
    start_time: event.start_time,
    end_time: event.end_time,
    formatted_date: formatEventDate(event.start_time),
    formatted_time: formatEventTime(event.start_time),
    formatted_end_time: formatEventEndTime(event.end_time ?? null),
    formatted_end_date: event.end_time ? formatEventDate(event.end_time) : null,
    is_multi_day: isMultiDay,
    attending_count: event.attending_count || 0,
    interested_count: event.interested_count || 0,
    place: event.place || null,
    cover,
  }
}

async function fetchEventsForMonth(
  year: number,
  month: number
): Promise<Record<string, unknown>[]> {
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0, 23, 59, 59)
  const since = Math.floor(startDate.getTime() / 1000)
  const until = Math.floor(endDate.getTime() / 1000)
  const allRawEvents: RawEvent[] = []
  let url: string | null = `https://graph.facebook.com/v23.0/${FACEBOOK_PAGE_ID}/events?access_token=${FACEBOOK_ACCESS_TOKEN}&fields=id,name,description,start_time,end_time,place,attending_count,interested_count,cover&limit=100&since=${since}&until=${until}`

  try {
    while (url) {
      const response = await fetch(url)
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ Facebook API error for ${year}/${month}:`, response.status)
        if (response.status === 403 || isRateLimitError(errorText)) {
          console.error('⚠️  Rate limit reached!')
          throw new Error('RATE_LIMIT')
        }
        if (isTokenExpiredError(errorText)) {
          console.error('❌ Facebook access token has expired!')
          throw new Error('TOKEN_EXPIRED')
        }
        throw new Error(`Failed to fetch events: ${response.status} ${response.statusText}`)
      }
      const data = (await response.json()) as {
        data?: RawEvent[]
        paging?: { next?: string }
      }
      if (data.data?.length) {
        allRawEvents.push(...data.data)
      }
      if (data.paging?.next) {
        url = data.paging.next
        await new Promise((r) => setTimeout(r, 200))
      } else {
        url = null
      }
    }
    if (allRawEvents.length === 0) return []
    return Promise.all(allRawEvents.map((e) => formatEvent(e)))
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (message === 'RATE_LIMIT' || message === 'TOKEN_EXPIRED') throw err
    console.error(`Error fetching events for ${year}/${month}:`, err)
    throw err
  }
}

function saveEventsToFile(
  year: number,
  month: number,
  events: Record<string, unknown>[]
): void {
  const yearDir = path.join(DATA_DIR, year.toString())
  if (!fs.existsSync(yearDir)) {
    fs.mkdirSync(yearDir, { recursive: true })
  }
  const filePath = path.join(yearDir, `${month.toString().padStart(2, '0')}.json`)
  fs.writeFileSync(filePath, JSON.stringify(events, null, 2), 'utf8')
  console.log(`✅ Saved ${events.length} events to ${filePath}`)
}

interface Progress {
  completed: Array<{ year: number; month: number }>
  failed: Array<{ year: number; month: number; error: string }>
  lastUpdated: string | null
}

function loadProgress(): Progress {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      const content = fs.readFileSync(PROGRESS_FILE, 'utf8')
      return JSON.parse(content) as Progress
    }
  } catch (error) {
    console.error('Error loading progress file:', error)
  }
  return { completed: [], failed: [], lastUpdated: null }
}

function saveProgress(progress: Progress): void {
  try {
    const dataDir = path.dirname(PROGRESS_FILE)
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
    progress.lastUpdated = new Date().toISOString()
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2), 'utf8')
  } catch (error) {
    console.error('Error saving progress file:', error)
  }
}

function isMonthCompleted(progress: Progress, year: number, month: number): boolean {
  return progress.completed.some((item) => item.year === year && item.month === month)
}

function generateMonthList(): Array<{ year: number; month: number }> {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  const startYear = 2022
  const startMonth = 7
  const endYear = currentMonth === 1 ? currentYear - 1 : currentYear
  const endMonth = currentMonth === 1 ? 12 : currentMonth - 1
  const months: Array<{ year: number; month: number }> = []
  for (let y = startYear; y <= endYear; y++) {
    const monthStart = y === startYear ? startMonth : 1
    const monthEnd = y === endYear ? endMonth : 12
    for (let m = monthStart; m <= monthEnd; m++) {
      months.push({ year: y, month: m })
    }
  }
  return months
}

async function main(): Promise<void> {
  console.log('🚀 Starting historical events download...\n')
  const progress = loadProgress()
  console.log(`📊 Progress: ${progress.completed.length} months completed, ${progress.failed.length} failed\n`)
  const monthsToProcess = generateMonthList()
  console.log(`📅 Total months to process: ${monthsToProcess.length} (from 2022/07 to previous month)\n`)
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
      console.log(`\n📥 Fetching events for ${year}/${month.toString().padStart(2, '0')}...`)
      const events = await fetchEventsForMonth(year, month)
      saveEventsToFile(year, month, events)
      const eventsWithLocalCovers = events.filter(
        (e) =>
          (e.cover as { source?: string })?.source?.startsWith('/event-covers/')
      )
      if (eventsWithLocalCovers.length > 0) {
        console.log(`   📸 ${eventsWithLocalCovers.length} cover image(s) (cached or downloaded)`)
      }
      progress.completed.push({ year, month })
      saveProgress(progress)
      processed++
      saved += events.length
      console.log(`✅ Completed ${year}/${month.toString().padStart(2, '0')}: ${events.length} events`)
      await new Promise((resolve) => setTimeout(resolve, 1000))
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (message === 'RATE_LIMIT') {
        console.error(`\n⚠️  Rate limit reached at ${year}/${month}`)
        console.error('💾 Progress saved. Please resume tomorrow.')
        rateLimited = true
        break
      }
      if (message === 'TOKEN_EXPIRED') {
        console.error(`\n❌ Token expired at ${year}/${month}`)
        console.error('Please update your FACEBOOK_ACCESS_TOKEN and try again.')
        break
      }
      console.error(`❌ Error processing ${year}/${month}:`, message)
      progress.failed.push({ year, month, error: message })
      saveProgress(progress)
    }
  }
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

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})

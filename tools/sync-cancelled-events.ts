/**
 * Script to sync cancelled events into monthly event files.
 * Usage: npx tsx tools/sync-cancelled-events.ts
 */

import fs from 'fs'
import path from 'path'
import {
  downloadCoverImage,
  getCoverImagePath,
} from '../lib/download-cover-image'
import { isValidFacebookEventId } from '../lib/event-id'
import { isMultiDayByTimes } from '../lib/event-utils'

const BRISBANE_TIMEZONE = 'Australia/Brisbane'
const DATA_DIR = path.join(process.cwd(), 'data', 'events')
const CANCELLED_IDS_FILE = path.join(DATA_DIR, 'cancelled-event-ids.json')

interface FacebookApiEvent {
  id: string
  name: string
  description?: string
  start_time: string
  end_time?: string | null
  place?: { name?: string } | null
  attending_count?: number
  interested_count?: number
  cover?: { source: string; id?: string } | null
  is_canceled?: boolean
}

interface StoredEvent {
  id: string
  name: string
  description: string
  start_time: string
  end_time?: string | null
  formatted_date: string
  formatted_time: string
  formatted_end_time: string | null
  formatted_end_date: string | null
  is_multi_day: boolean
  attending_count: number
  interested_count: number
  place: { name?: string } | null
  cover: { source: string; id?: string } | null
  is_cancelled: boolean
}

function loadEnvFile(): void {
  const envFiles = ['.env.local', '.env']
  for (const envFile of envFiles) {
    const envPath = path.join(process.cwd(), envFile)
    if (!fs.existsSync(envPath)) continue
    const content = fs.readFileSync(envPath, 'utf8')
    const lines = content.split('\n')
    for (const line of lines) {
      const trimmedLine = line.trim()
      if (!trimmedLine || trimmedLine.startsWith('#')) continue
      const [key, ...valueParts] = trimmedLine.split('=')
      if (!key || valueParts.length === 0) continue
      const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '')
      process.env[key.trim()] = value
    }
    return
  }
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

function formatEventEndTime(dateString: string | null | undefined): string | null {
  if (!dateString) return null
  const date = new Date(dateString)
  return date.toLocaleTimeString('en-AU', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: BRISBANE_TIMEZONE,
  })
}

function getCalendarDateInTimeZone(dateString: string): { year: number; month: number } {
  const date = new Date(dateString)
  const parts = new Intl.DateTimeFormat('en-AU', {
    timeZone: BRISBANE_TIMEZONE,
    year: 'numeric',
    month: 'numeric',
  }).formatToParts(date)

  const yearPart = parts.find((part) => part.type === 'year')?.value
  const monthPart = parts.find((part) => part.type === 'month')?.value
  const year = yearPart ? Number(yearPart) : date.getUTCFullYear()
  const month = monthPart ? Number(monthPart) : date.getUTCMonth() + 1
  return { year, month }
}

function getMonthFilePath(year: number, month: number): string {
  const yearDir = path.join(DATA_DIR, year.toString())
  return path.join(yearDir, `${month.toString().padStart(2, '0')}.json`)
}

function readCancelledEventIds(): string[] {
  if (!fs.existsSync(CANCELLED_IDS_FILE)) {
    console.error(`❌ Cancelled IDs file not found: ${CANCELLED_IDS_FILE}`)
    return []
  }

  try {
    const content = fs.readFileSync(CANCELLED_IDS_FILE, 'utf8')
    const parsed = JSON.parse(content) as unknown
    const ids = Array.isArray(parsed)
      ? parsed
      : (parsed as { ids?: unknown[] })?.ids || []

    const validIds = ids
      .filter((value) => value != null)
      .map((value) => String(value).trim())
      .filter((id) => isValidFacebookEventId(id))

    const uniqueIds = [...new Set(validIds)]
    const skippedCount = ids.length - uniqueIds.length
    if (skippedCount > 0) {
      console.warn(`⚠️  Skipped ${skippedCount} invalid/duplicate cancelled event ID(s)`)
    }
    return uniqueIds
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`❌ Failed to parse cancelled IDs file: ${message}`)
    return []
  }
}

async function fetchEventByIdFromApi(eventId: string): Promise<FacebookApiEvent | null> {
  const accessToken = process.env.FACEBOOK_ACCESS_TOKEN
  if (!accessToken) {
    console.error('❌ FACEBOOK_ACCESS_TOKEN environment variable is not set')
    return null
  }

  const fields =
    'id,name,description,start_time,end_time,place,attending_count,interested_count,cover,is_canceled'
  const url = `https://graph.facebook.com/v23.0/${eventId}?access_token=${accessToken}&fields=${fields}`

  try {
    const response = await fetch(url)
    if (!response.ok) {
      const body = await response.text()
      console.warn(`⚠️  Failed to fetch ${eventId}: ${response.status} ${response.statusText}`)
      console.warn(`    ${body}`)
      return null
    }
    const event = (await response.json()) as FacebookApiEvent
    if (!event?.id || !event.start_time || !event.name) {
      console.warn(`⚠️  Event ${eventId} was returned with incomplete data`)
      return null
    }
    return event
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn(`⚠️  Error fetching ${eventId}: ${message}`)
    return null
  }
}

async function toStoredEvent(event: FacebookApiEvent): Promise<StoredEvent> {
  const isMultiDay = isMultiDayByTimes(event.start_time, event.end_time)

  let cover = event.cover || null
  if (cover?.source) {
    const localPath = getCoverImagePath(event.id, cover.source)
    if (localPath?.startsWith('/event-covers/')) {
      cover = { ...cover, source: localPath }
    } else {
      await downloadCoverImage(event.id, cover.source)
      const downloadedPath = getCoverImagePath(event.id, cover.source)
      if (downloadedPath?.startsWith('/event-covers/')) {
        cover = { ...cover, source: downloadedPath }
      }
    }
  }

  return {
    id: event.id,
    name: event.name,
    description: event.description || '',
    start_time: event.start_time,
    end_time: event.end_time ?? null,
    formatted_date: formatEventDate(event.start_time),
    formatted_time: formatEventTime(event.start_time),
    formatted_end_time: formatEventEndTime(event.end_time),
    formatted_end_date: event.end_time ? formatEventDate(event.end_time) : null,
    is_multi_day: isMultiDay,
    attending_count: event.attending_count || 0,
    interested_count: event.interested_count || 0,
    place: event.place || null,
    cover,
    is_cancelled: true,
  }
}

function loadMonthEvents(filePath: string): StoredEvent[] {
  if (!fs.existsSync(filePath)) return []
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    const parsed = JSON.parse(content) as unknown
    return Array.isArray(parsed) ? (parsed as StoredEvent[]) : []
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn(`⚠️  Could not parse ${filePath}: ${message}`)
    return []
  }
}

function upsertIntoMonthFile(event: StoredEvent): 'added' | 'updated' {
  const { year, month } = getCalendarDateInTimeZone(event.start_time)
  const filePath = getMonthFilePath(year, month)
  const yearDir = path.dirname(filePath)

  if (!fs.existsSync(yearDir)) {
    fs.mkdirSync(yearDir, { recursive: true })
  }

  const events = loadMonthEvents(filePath)
  const existingIndex = events.findIndex((item) => item.id === event.id)

  let result: 'added' | 'updated'
  if (existingIndex >= 0) {
    events[existingIndex] = {
      ...events[existingIndex],
      ...event,
      is_cancelled: true,
    }
    result = 'updated'
  } else {
    events.push(event)
    result = 'added'
  }

  events.sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  )

  fs.writeFileSync(filePath, JSON.stringify(events, null, 2), 'utf8')
  return result
}

async function main(): Promise<void> {
  loadEnvFile()

  const facebookAccessToken = process.env.FACEBOOK_ACCESS_TOKEN
  const facebookPageId = process.env.FACEBOOK_PAGE_ID

  if (!facebookAccessToken) {
    console.error('❌ FACEBOOK_ACCESS_TOKEN environment variable is not set')
    process.exit(1)
  }
  if (!facebookPageId) {
    console.warn('⚠️  FACEBOOK_PAGE_ID environment variable is not set (not required for this script)')
  }

  const cancelledIds = readCancelledEventIds()
  if (cancelledIds.length === 0) {
    console.log('ℹ️  No cancelled event IDs to sync')
    return
  }

  console.log(`🚀 Syncing ${cancelledIds.length} cancelled event(s)...\n`)

  let added = 0
  let updated = 0
  let failed = 0

  for (const eventId of cancelledIds) {
    const rawEvent = await fetchEventByIdFromApi(eventId)
    if (!rawEvent) {
      failed++
      continue
    }

    const storedEvent = await toStoredEvent(rawEvent)
    const result = upsertIntoMonthFile(storedEvent)
    const { year, month } = getCalendarDateInTimeZone(storedEvent.start_time)
    const monthLabel = `${year}/${month.toString().padStart(2, '0')}`

    if (result === 'added') {
      added++
      console.log(`✅ Added ${eventId} to ${monthLabel}`)
    } else {
      updated++
      console.log(`♻️  Updated ${eventId} in ${monthLabel}`)
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log('📊 Cancelled Event Sync Summary')
  console.log(`   Added:   ${added}`)
  console.log(`   Updated: ${updated}`)
  console.log(`   Failed:  ${failed}`)
  console.log('='.repeat(50))
}

main().catch((error) => {
  console.error('❌ Fatal error syncing cancelled events:', error)
  process.exit(1)
})

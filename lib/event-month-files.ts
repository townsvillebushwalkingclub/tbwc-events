/**
 * Read and write archived events in data/events/YYYY/MM.json.
 */

import fs from 'fs'
import path from 'path'
import { getLocalCoverPath } from '@/lib/event-cover-path'
import { isValidFacebookEventId } from '@/lib/event-id'
import { getCalendarDateInTimeZone } from '@/lib/event-utils'
import { isRuntimeFilesystemWritable } from '@/lib/runtime-writable'
import type { TBWCEvent } from '@/types/event'

export const EVENTS_DATA_DIR = path.join(process.cwd(), 'data', 'events')

export function getMonthFilePath(year: number, month: number): string {
  const yearDir = path.join(EVENTS_DATA_DIR, year.toString())
  return path.join(yearDir, `${month.toString().padStart(2, '0')}.json`)
}

/** Past = calendar month strictly before the current month (Brisbane). */
export function isPastMonth(year: number, month: number, now = new Date()): boolean {
  const today = getCalendarDateInTimeZone(now)
  if (year < today.year) return true
  if (year === today.year && month < today.month) return true
  return false
}

function applyLocalCover(event: TBWCEvent): TBWCEvent {
  if (!event.cover?.source) return event
  const localPath = getLocalCoverPath(event.id)
  if (localPath?.startsWith('/event-covers/')) {
    return { ...event, cover: { ...event.cover, source: localPath } }
  }
  return event
}

function readMonthFileRaw(filePath: string): TBWCEvent[] {
  if (!fs.existsSync(filePath)) return []
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    const parsed = JSON.parse(content) as unknown
    return Array.isArray(parsed) ? (parsed as TBWCEvent[]) : []
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn(`Could not parse ${filePath}: ${message}`)
    return []
  }
}

/** Find an event by ID in any archived month file (no API call). */
export function findEventInMonthFiles(eventId: string): TBWCEvent | null {
  if (!isValidFacebookEventId(eventId)) return null
  if (!fs.existsSync(EVENTS_DATA_DIR)) return null

  try {
    const yearDirs = fs
      .readdirSync(EVENTS_DATA_DIR)
      .filter((dir) => {
        const dirPath = path.join(EVENTS_DATA_DIR, dir)
        return fs.statSync(dirPath).isDirectory() && /^\d{4}$/.test(dir)
      })
      .map((dir) => parseInt(dir, 10))
      .sort((a, b) => b - a)

    for (const year of yearDirs) {
      const yearDir = path.join(EVENTS_DATA_DIR, year.toString())
      const monthFiles = fs
        .readdirSync(yearDir)
        .filter((file) => file.endsWith('.json'))
        .map((file) => parseInt(file.replace('.json', ''), 10))
        .sort((a, b) => b - a)

      for (const month of monthFiles) {
        const filePath = getMonthFilePath(year, month)
        const events = readMonthFileRaw(filePath)
        const event = events.find((e) => e.id === eventId)
        if (event) return applyLocalCover(event)
      }
    }
  } catch (error) {
    console.error('Error searching month files for event:', error)
  }

  return null
}

/**
 * Insert or update one event in its start-month JSON file.
 * Never creates a month archive - only updates files that already exist
 * (created by month:sync).
 */
export function upsertEventIntoMonthFile(
  event: TBWCEvent
): 'added' | 'updated' | 'skipped' {
  const { year, month } = getCalendarDateInTimeZone(event.start_time)
  const filePath = getMonthFilePath(year, month)

  if (!fs.existsSync(filePath)) {
    return 'skipped'
  }

  if (!isRuntimeFilesystemWritable()) {
    return 'updated'
  }

  const events = readMonthFileRaw(filePath)
  const existingIndex = events.findIndex((item) => item.id === event.id)

  let result: 'added' | 'updated'
  if (existingIndex >= 0) {
    events[existingIndex] = { ...events[existingIndex], ...event }
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

/**
 * Load a cancelled event: month files first, then Facebook.
 * If a past-month archive already exists, upsert into it; never create stubs.
 */
export async function resolveCancelledEvent(
  eventId: string,
  fetchFromApi: (id: string) => Promise<TBWCEvent | null>
): Promise<TBWCEvent | null> {
  const fromFile = findEventInMonthFiles(eventId)
  if (fromFile) return fromFile

  const fromApi = await fetchFromApi(eventId)
  if (!fromApi) return null

  const event: TBWCEvent = { ...fromApi, is_cancelled: true }
  const { year, month } = getCalendarDateInTimeZone(event.start_time)
  if (isPastMonth(year, month)) {
    upsertEventIntoMonthFile(event)
  }

  return applyLocalCover(event)
}

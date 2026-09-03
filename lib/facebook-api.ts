/**
 * Facebook Graph API integration for Townsville Bushwalking Club
 */

import fs from 'fs'
import path from 'path'
import { downloadCoverImage } from './download-cover-image'
import { getLocalCoverPath } from './event-cover-path'
import { applyLocalCoverToEvent } from './event-share-image'
import { isValidFacebookEventId } from './event-id'
import {
  EVENTS_DATA_DIR,
  findEventInMonthFiles,
  getMonthFilePath,
  isPastMonth,
  resolveCancelledEvent,
} from './event-month-files'
import { getCalendarDateInTimeZone, isMultiDayByTimes } from './event-utils'
import type { TBWCEvent } from '@/types/event'

const BRISBANE_TIMEZONE = 'Australia/Brisbane'
const DATA_DIR = EVENTS_DATA_DIR

const FACEBOOK_PAGE_ID = process.env.FACEBOOK_PAGE_ID
const FACEBOOK_ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN

if (!FACEBOOK_ACCESS_TOKEN) {
  console.warn('FACEBOOK_ACCESS_TOKEN environment variable is not set')
}
if (!FACEBOOK_PAGE_ID) {
  console.warn('FACEBOOK_PAGE_ID environment variable is not set')
}

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

const sampleEvents: TBWCEvent[] =
  process.env.NODE_ENV === 'development'
    ? [
        {
          id: 'sample-1',
          name: 'Sample Event 1',
          description: 'This is a sample event for testing purposes.',
          start_time: '2025-08-15T09:00:00+10:00',
          end_time: '2025-08-15T17:00:00+10:00',
          formatted_date: 'Friday, 15 August 2025',
          formatted_time: '9:00 AM',
          formatted_end_time: '5:00 PM',
          formatted_end_date: null,
          is_multi_day: false,
          attending_count: 5,
          interested_count: 12,
          place: { name: 'Sample Location' },
          cover: null,
        },
        {
          id: 'sample-2',
          name: 'Sample Multi-Day Event',
          description: 'This is a sample multi-day event.',
          start_time: '2025-08-30T09:00:00+10:00',
          end_time: '2025-08-31T17:00:00+10:00',
          formatted_date: 'Saturday, 30 August 2025',
          formatted_time: '9:00 AM',
          formatted_end_time: '5:00 PM',
          formatted_end_date: 'Sunday, 31 August 2025',
          is_multi_day: true,
          attending_count: 8,
          interested_count: 15,
          place: { name: 'Sample Multi-Day Location' },
          cover: null,
        },
      ]
    : []

import {
  FACEBOOK_EVENTS_CACHE_DURATION_MS,
  FACEBOOK_EVENTS_CACHE_TAG,
  FACEBOOK_EVENTS_REVALIDATE_SECONDS,
  facebookEventCacheTag,
} from '@/lib/cache-constants'
import { isRuntimeFilesystemWritable } from '@/lib/runtime-writable'

export {
  FACEBOOK_EVENTS_CACHE_DURATION_MS,
  FACEBOOK_EVENTS_REVALIDATE_SECONDS,
} from '@/lib/cache-constants'

let eventsCache: TBWCEvent[] | null = null
let cacheTimestamp: number | null = null
const CACHE_DURATION = FACEBOOK_EVENTS_CACHE_DURATION_MS

function isTokenExpiredError(errorData: string | unknown): boolean {
  try {
    const error =
      typeof errorData === 'string' ? JSON.parse(errorData) : errorData
    const err = error as {
      error?: { code?: number; error_subcode?: number }
    }
    return (
      !!err.error &&
      err.error.code === 190 &&
      (err.error.error_subcode === 463 || err.error.error_subcode === 467)
    )
  } catch {
    return false
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

async function getFacebookEvents(): Promise<TBWCEvent[]> {
  if (!FACEBOOK_ACCESS_TOKEN) {
    throw new Error('Facebook access token is required')
  }
  const now = Date.now()
  if (
    eventsCache &&
    cacheTimestamp &&
    now - cacheTimestamp < CACHE_DURATION
  ) {
    return eventsCache
  }

  const url = `https://graph.facebook.com/v23.0/${FACEBOOK_PAGE_ID}/events?access_token=${FACEBOOK_ACCESS_TOKEN}&fields=id,name,description,start_time,end_time,place,attending_count,interested_count,cover,is_canceled&limit=100`

  try {
    const response = await fetch(url, {
      next: {
        revalidate: FACEBOOK_EVENTS_REVALIDATE_SECONDS,
        tags: [FACEBOOK_EVENTS_CACHE_TAG],
      },
    })
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Facebook API error response:', errorText)
      if (isTokenExpiredError(errorText)) {
        console.error('⚠️  Facebook access token has expired!')
        console.error('🔧 To refresh your token, run: npm run token:refresh')
        if (eventsCache) {
          console.log('⚠️  Using cached data while token is expired')
          return eventsCache
        }
      }
      if (response.status === 403 && eventsCache) {
        console.log('Rate limit reached, using cached data')
        return eventsCache
      }
      if (response.status === 403) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Rate limit reached, no cache available, using sample data')
          return sampleEvents
        }
        console.log('Rate limit reached, no cache available, returning empty array in production')
        return []
      }
      throw new Error(`Failed to fetch events: ${response.status} ${response.statusText}`)
    }

    const data = (await response.json()) as { data?: FacebookApiEvent[] }
    if (!data.data) {
      console.warn('No events data returned from Facebook API')
      return []
    }

    const formattedEvents = await Promise.all(
      data.data.map(async (event): Promise<TBWCEvent> => {
        const isMultiDay = isMultiDayByTimes(event.start_time, event.end_time)

        let cover = event.cover || null
        if (cover?.source) {
          const localPath = getLocalCoverPath(event.id)
          if (localPath?.startsWith('/event-covers/')) {
            cover = { ...cover, source: localPath }
          } else {
            await downloadCoverImage(event.id, cover.source)
            const downloadedPath = getLocalCoverPath(event.id)
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
          formatted_end_date: event.end_time
            ? formatEventDate(event.end_time)
            : null,
          is_multi_day: isMultiDay,
          attending_count: event.attending_count || 0,
          interested_count: event.interested_count || 0,
          place: event.place || null,
          cover,
          is_cancelled: event.is_canceled === true,
        }
      })
    )

    eventsCache = formattedEvents
    cacheTimestamp = now
    return formattedEvents
  } catch (error) {
    console.error('Error fetching Facebook events:', error)
    if (eventsCache) {
      console.log('Using cached data due to error')
      return eventsCache
    }
    if (process.env.NODE_ENV === 'development') {
      console.log('No cache available, using sample data due to error')
      return sampleEvents
    }
    console.log('No cache available, returning empty array in production due to error')
    return []
  }
}

async function fetchEventByIdFromApi(eventId: string): Promise<TBWCEvent | null> {
  if (!FACEBOOK_ACCESS_TOKEN) return null
  const fields =
    'id,name,description,start_time,end_time,place,attending_count,interested_count,cover,is_canceled'
  const url = `https://graph.facebook.com/v23.0/${eventId}?access_token=${FACEBOOK_ACCESS_TOKEN}&fields=${fields}`
  try {
    const response = await fetch(url, {
      next: {
        revalidate: FACEBOOK_EVENTS_REVALIDATE_SECONDS,
        tags: [FACEBOOK_EVENTS_CACHE_TAG, facebookEventCacheTag(eventId)],
      },
    })
    if (!response.ok) return null
    const event = (await response.json()) as FacebookApiEvent | null
    if (!event?.id) return null

    const isMultiDay = isMultiDayByTimes(event.start_time, event.end_time)

    let cover = event.cover || null
    if (cover?.source) {
      const localPath = getLocalCoverPath(event.id)
      if (localPath?.startsWith('/event-covers/')) {
        cover = { ...cover, source: localPath }
      } else {
        await downloadCoverImage(event.id, cover.source)
        const downloadedPath = getLocalCoverPath(event.id)
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
      formatted_end_date: event.end_time
        ? formatEventDate(event.end_time)
        : null,
      is_multi_day: isMultiDay,
      attending_count: event.attending_count || 0,
      interested_count: event.interested_count || 0,
      place: event.place || null,
      cover,
      is_cancelled: event.is_canceled === true,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn('Error fetching event by ID from API:', message)
    return null
  }
}

function getCancelledEventIds(): string[] {
  const filePath = path.join(DATA_DIR, 'cancelled-event-ids.json')
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8')
      const data = JSON.parse(content) as unknown
      const ids = Array.isArray(data) ? data : (data as { ids?: unknown[] }).ids || []
      return ids
        .filter((id) => id != null)
        .map((id) => String(id).trim())
        .filter((id) => isValidFacebookEventId(id))
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.warn('Error reading cancelled-event-ids.json:', message)
  }
  return []
}

/** Force `is_cancelled` when the ID is listed in cancelled-event-ids.json. */
function withCancelledOverride(
  event: TBWCEvent,
  cancelledIds: Set<string>
): TBWCEvent {
  if (!cancelledIds.has(event.id) || event.is_cancelled) return event
  return { ...event, is_cancelled: true }
}

async function mergeCancelledEventsIntoMonth(
  events: TBWCEvent[],
  year: number,
  month: number
): Promise<TBWCEvent[]> {
  const cancelledIds = getCancelledEventIds()
  const cancelledSet = new Set(cancelledIds)
  const result = events.map((event) =>
    withCancelledOverride(event, cancelledSet)
  )
  const existingIds = new Set(result.map((e) => e.id))
  for (const id of cancelledIds) {
    if (existingIds.has(id)) continue
    const event = await resolveCancelledEvent(id, fetchEventByIdFromApi)
    if (!event) continue
    const { year: y, month: m } = getCalendarDateInTimeZone(event.start_time)
    if (y === year && m === month) {
      result.push(event)
      existingIds.add(event.id)
    }
  }
  result.sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  )
  return result
}

/**
 * Returns event IDs from past months' data files only (no API calls).
 * Used at build time to prerender /api/event/[id] for past events.
 */
export function getPastEventIdsFromFiles(): string[] {
  const ids: string[] = []
  try {
    if (!fs.existsSync(DATA_DIR)) return ids
    const yearDirs = fs
      .readdirSync(DATA_DIR)
      .filter((dir) => {
        const dirPath = path.join(DATA_DIR, dir)
        return (
          fs.statSync(dirPath).isDirectory() && /^\d{4}$/.test(dir)
        )
      })
      .map((dir) => parseInt(dir, 10))
    for (const year of yearDirs) {
      const yearDir = path.join(DATA_DIR, year.toString())
      const monthFiles = fs
        .readdirSync(yearDir)
        .filter((file) => file.endsWith('.json'))
        .map((file) => parseInt(file.replace('.json', ''), 10))
      for (const month of monthFiles) {
        if (!isPastMonth(year, month)) continue
        const fileEvents = loadEventsFromFile(year, month)
        if (fileEvents) {
          for (const event of fileEvents) {
            if (event?.id && isValidFacebookEventId(String(event.id))) {
              ids.push(String(event.id))
            }
          }
        }
      }
    }
    const cancelledIds = getCancelledEventIds()
    for (const id of cancelledIds) {
      if (!ids.includes(id)) ids.push(id)
    }
  } catch (error) {
    console.error('Error reading past event IDs from files:', error)
  }
  return [...new Set(ids)]
}

const MIN_YEAR = 2022

/**
 * Returns (year, month) pairs for past months that have data files.
 * Used at build time to prerender /api/events/[year]/[month] for past months.
 */
export function getPastYearMonthsFromFiles(): Array<{ year: number; month: number }> {
  const pairs: Array<{ year: number; month: number }> = []
  try {
    if (!fs.existsSync(DATA_DIR)) return pairs
    const yearDirs = fs
      .readdirSync(DATA_DIR)
      .filter((dir) => {
        const dirPath = path.join(DATA_DIR, dir)
        return (
          fs.statSync(dirPath).isDirectory() && /^\d{4}$/.test(dir)
        )
      })
      .map((dir) => parseInt(dir, 10))
      .filter((y) => y >= MIN_YEAR)
    for (const year of yearDirs) {
      const yearDir = path.join(DATA_DIR, year.toString())
      const monthFiles = fs
        .readdirSync(yearDir)
        .filter((file) => file.endsWith('.json'))
        .map((file) => parseInt(file.replace('.json', ''), 10))
        .filter((m) => m >= 1 && m <= 12)
      for (const month of monthFiles) {
        if (!isPastMonth(year, month)) continue
        pairs.push({ year, month })
      }
    }
  } catch (error) {
    console.error('Error reading past year/months from files:', error)
  }
  return pairs
}

function loadEventsFromFile(year: number, month: number): TBWCEvent[] | null {
  try {
    const filePath = getMonthFilePath(year, month)
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf8')
      const events = JSON.parse(fileContent) as TBWCEvent[]
      const updatedEvents = events.map((event) => {
        if (event.cover?.source) {
          const localPath = getLocalCoverPath(event.id)
          if (localPath?.startsWith('/event-covers/')) {
            return {
              ...event,
              cover: { ...event.cover, source: localPath },
            }
          }
        }
        return event
      })
      const matchingMonth = updatedEvents.filter((event) => {
        if (!event.start_time) return false
        const { year: y, month: m } = getCalendarDateInTimeZone(event.start_time)
        return y === year && m === month
      })
      if (matchingMonth.length !== updatedEvents.length) {
        console.warn(
          `Ignored ${updatedEvents.length - matchingMonth.length} event(s) in ${year}/${month.toString().padStart(2, '0')}.json whose start_time is outside that month (Brisbane)`
        )
      }
      return matchingMonth
    }
  } catch (error) {
    console.error(`Error loading events from file for ${year}/${month}:`, error)
  }
  return null
}

async function saveEventsToFile(
  year: number,
  month: number,
  events: TBWCEvent[]
): Promise<void> {
  if (!isRuntimeFilesystemWritable()) {
    return
  }

  try {
    const eventsToSave = await Promise.all(
      events.map(async (event) => {
        if (!event.cover?.source) return event
        const src = event.cover.source
        if (src.startsWith('/event-covers/')) return event
        const localPath =
          getLocalCoverPath(event.id) ||
          (await downloadCoverImage(event.id, src))
        if (localPath?.startsWith('/event-covers/')) {
          return { ...event, cover: { ...event.cover, source: localPath } }
        }
        return event
      })
    )
    const yearDir = path.join(DATA_DIR, year.toString())
    if (!fs.existsSync(yearDir)) {
      fs.mkdirSync(yearDir, { recursive: true })
    }
    const filePath = getMonthFilePath(year, month)
    fs.writeFileSync(filePath, JSON.stringify(eventsToSave, null, 2), 'utf8')
    console.log(`Saved ${eventsToSave.length} events to file for ${year}/${month}`)
  } catch (error) {
    console.error(`Error saving events to file for ${year}/${month}:`, error)
  }
}

export async function getPageInfo(): Promise<unknown> {
  if (!FACEBOOK_ACCESS_TOKEN) {
    throw new Error('Facebook access token is required')
  }
  const url = `https://graph.facebook.com/v23.0/${FACEBOOK_PAGE_ID}?access_token=${FACEBOOK_ACCESS_TOKEN}&fields=id,name,about,fan_count`
  const response = await fetch(url)
  if (!response.ok) {
    const errorText = await response.text()
    console.error('Facebook API error response:', errorText)
    throw new Error(`Failed to fetch page info: ${response.status} ${response.statusText}`)
  }
  return response.json()
}

export async function getEventsForMonth(
  year: number,
  month: number
): Promise<TBWCEvent[]> {
  try {
    if (isPastMonth(year, month)) {
      const fileEvents = loadEventsFromFile(year, month)
      if (fileEvents !== null) {
        return mergeCancelledEventsIntoMonth(fileEvents, year, month)
      }
      console.log(
        `No saved data found for past month ${year}/${month}, fetching from Facebook...`
      )
    }

    const allEvents = await getFacebookEvents()
    const filteredEvents = allEvents.filter((event) => {
      const { year: y, month: m } = getCalendarDateInTimeZone(event.start_time)
      return y === year && m === month
    })

    if (isPastMonth(year, month) && filteredEvents.length > 0) {
      await saveEventsToFile(year, month, filteredEvents)
    }

    return mergeCancelledEventsIntoMonth(filteredEvents, year, month)
  } catch (error) {
    console.error('Error getting events for month:', error)
    throw error
  }
}

export async function getEventsForCalendarMonths(
  months: Array<{ year: number; month: number }>
): Promise<TBWCEvent[]> {
  if (!months?.length) return []
  const allEvents = await getFacebookEvents()
  const cancelledIds = getCancelledEventIds()
  const cancelledSet = new Set(cancelledIds)
  const existingIds = new Set<string>()
  const byMonth = new Map<string, TBWCEvent[]>()
  for (const { year, month } of months) {
    const key = `${year}-${month}`
    const filtered = allEvents
      .filter((event) => {
        const { year: y, month: m } = getCalendarDateInTimeZone(event.start_time)
        return y === year && m === month
      })
      .map((event) => withCancelledOverride(event, cancelledSet))
    filtered.forEach((e) => existingIds.add(e.id))
    byMonth.set(key, filtered)
  }
  for (const id of cancelledIds) {
    if (existingIds.has(id)) continue
    const event = await resolveCancelledEvent(id, fetchEventByIdFromApi)
    if (!event) continue
    const { year: y, month: m } = getCalendarDateInTimeZone(event.start_time)
    const key = `${y}-${m}`
    const list = byMonth.get(key)
    if (list) {
      list.push(event)
      existingIds.add(event.id)
    }
  }
  const combined: TBWCEvent[] = []
  for (const list of byMonth.values()) {
    list.sort(
      (a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    )
    combined.push(...list)
  }
  combined.sort(
    (a, b) =>
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  )
  return combined
}

export async function getEventById(eventId: string): Promise<TBWCEvent | null> {
  try {
    const cancelledSet = new Set(getCancelledEventIds())
    const finish = (event: TBWCEvent): TBWCEvent =>
      applyLocalCoverToEvent(withCancelledOverride(event, cancelledSet))

    if (eventsCache) {
      const cachedEvent = eventsCache.find((e) => e.id === eventId)
      if (cachedEvent) return finish(cachedEvent)
    }

    const fromFiles = findEventInMonthFiles(eventId)
    if (fromFiles) return finish(fromFiles)

    if (cancelledSet.has(eventId)) {
      const resolved = await resolveCancelledEvent(
        eventId,
        fetchEventByIdFromApi
      )
      if (resolved) return applyLocalCoverToEvent(resolved)
    }

    const fromApi = await fetchEventByIdFromApi(eventId)
    if (fromApi) return finish(fromApi)

    const allEvents = await getFacebookEvents()
    const event = allEvents.find((e) => e.id === eventId)
    return event ? finish(event) : null
  } catch (error) {
    console.error('Error getting event by ID:', error)
    throw error
  }
}

export function clearEventsCache(): void {
  eventsCache = null
  cacheTimestamp = null
  console.log('Events cache cleared')
}

export async function getAllEvents(): Promise<TBWCEvent[]> {
  const allEvents: TBWCEvent[] = []
  try {
    const currentEvents = await getFacebookEvents()
    allEvents.push(...currentEvents)

    if (fs.existsSync(DATA_DIR)) {
      const yearDirs = fs
        .readdirSync(DATA_DIR)
        .filter((dir) => {
          const dirPath = path.join(DATA_DIR, dir)
          return (
            fs.statSync(dirPath).isDirectory() &&
            /^\d{4}$/.test(dir)
          )
        })
        .map((dir) => parseInt(dir, 10))
        .sort((a, b) => b - a)

      for (const year of yearDirs) {
        const yearDir = path.join(DATA_DIR, year.toString())
        const monthFiles = fs
          .readdirSync(yearDir)
          .filter((file) => file.endsWith('.json'))
          .map((file) => parseInt(file.replace('.json', ''), 10))
          .sort((a, b) => b - a)

        for (const month of monthFiles) {
          const fileEvents = loadEventsFromFile(year, month)
          if (fileEvents) {
            fileEvents.forEach((event) => {
              if (!allEvents.some((e) => e.id === event.id)) {
                allEvents.push(event)
              }
            })
          }
        }
      }
    }

    const cancelledIds = getCancelledEventIds()
    const cancelledSet = new Set(cancelledIds)
    for (let i = 0; i < allEvents.length; i++) {
      allEvents[i] = withCancelledOverride(allEvents[i], cancelledSet)
    }
    for (const id of cancelledIds) {
      if (allEvents.some((e) => e.id === id)) continue
      const event = await resolveCancelledEvent(id, fetchEventByIdFromApi)
      if (event) allEvents.push(event)
    }
  } catch (error) {
    console.error('Error getting all events for sitemap:', error)
  }

  return allEvents.map((event) => {
    if (event.cover?.source) {
      const localPath = getLocalCoverPath(event.id)
      if (localPath?.startsWith('/event-covers/')) {
        return { ...event, cover: { ...event.cover, source: localPath } }
      }
    }
    return event
  })
}

export { getFacebookEvents, formatEventDate, formatEventTime, formatEventEndTime }

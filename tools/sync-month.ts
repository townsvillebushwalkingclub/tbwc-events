/**
 * Fetch and archive events + cover images for the previous calendar month.
 * Designed to run on the 1st of each month so the just-completed month is
 * cached to data/events/YYYY/MM.json before the live Facebook API moves on.
 *
 * Usage (local):  npx tsx tools/sync-month.ts
 * Usage (CI):     called by .github/workflows/sync-month.yml
 */
import fs from 'fs'
import path from 'path'
import { downloadCoverImage } from '../lib/download-cover-image'
import { getCalendarDateInTimeZone } from '../lib/event-utils'

const BRISBANE_TZ = 'Australia/Brisbane'
const DATA_DIR = path.join(process.cwd(), 'data', 'events')
const SOURCES_FILE = path.join(process.cwd(), 'data', 'cover-sources.json')

type CoverSources = Record<string, string>

function loadSources(): CoverSources {
  try {
    return JSON.parse(fs.readFileSync(SOURCES_FILE, 'utf8')) as CoverSources
  } catch {
    return {}
  }
}

function saveSources(sources: CoverSources): void {
  const sorted = Object.fromEntries(
    Object.keys(sources).sort().map((k) => [k, sources[k]])
  )
  fs.writeFileSync(SOURCES_FILE, `${JSON.stringify(sorted, null, 2)}\n`, 'utf8')
}

function loadEnvFile(): void {
  for (const file of ['.env.local', '.env']) {
    const envPath = path.join(process.cwd(), file)
    if (!fs.existsSync(envPath)) continue
    for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const [key, ...rest] = trimmed.split('=')
      if (key && rest.length) {
        process.env[key.trim()] = rest.join('=').trim().replace(/^["']|["']$/g, '')
      }
    }
    return
  }
}

loadEnvFile()

const PAGE_ID = process.env.FACEBOOK_PAGE_ID
const TOKEN = process.env.FACEBOOK_ACCESS_TOKEN

if (!PAGE_ID || !TOKEN) {
  console.error('FACEBOOK_PAGE_ID and FACEBOOK_ACCESS_TOKEN must be set')
  process.exit(1)
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
  cover?: { source: string; id?: string } | null
  is_canceled?: boolean
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-AU', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    timeZone: BRISBANE_TZ,
  })
}

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('en-AU', {
    hour: 'numeric', minute: '2-digit', hour12: true,
    timeZone: BRISBANE_TZ,
  })
}

function getPreviousMonth(): { year: number; month: number } {
  const now = new Date()
  const month = now.getUTCMonth() + 1  // 1-12
  return month === 1
    ? { year: now.getUTCFullYear() - 1, month: 12 }
    : { year: now.getUTCFullYear(), month: month - 1 }
}

function getMonthBounds(year: number, month: number): { since: number; until: number } {
  const lastDay = new Date(year, month, 0).getDate()
  const mm = month.toString().padStart(2, '0')
  return {
    since: Math.floor(new Date(`${year}-${mm}-01T00:00:00+10:00`).getTime() / 1000),
    until: Math.floor(
      new Date(`${year}-${mm}-${String(lastDay).padStart(2, '0')}T23:59:59+10:00`).getTime() / 1000
    ),
  }
}

async function fetchEventsForMonth(year: number, month: number): Promise<RawEvent[]> {
  const { since, until } = getMonthBounds(year, month)
  const events: RawEvent[] = []
  let url: string | null =
    `https://graph.facebook.com/v23.0/${PAGE_ID}/events` +
    `?access_token=${TOKEN}&fields=id,name,description,start_time,end_time,place,attending_count,interested_count,cover,is_canceled&limit=100&since=${since}&until=${until}`

  while (url) {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Facebook API ${res.status}: ${await res.text()}`)
    const data = (await res.json()) as { data?: RawEvent[]; paging?: { next?: string } }
    if (data.data?.length) events.push(...data.data)
    url = data.paging?.next ?? null
  }

  // Filter to only events that actually belong in this month (Brisbane time)
  return events.filter((e) => {
    const { year: y, month: m } = getCalendarDateInTimeZone(e.start_time)
    return y === year && m === month
  })
}

async function main(): Promise<void> {
  const { year, month } = getPreviousMonth()
  const label = `${year}/${String(month).padStart(2, '0')}`

  const yearDir = path.join(DATA_DIR, String(year))
  const outPath = path.join(yearDir, `${String(month).padStart(2, '0')}.json`)

  if (fs.existsSync(outPath)) {
    console.log(`${label} already archived — skipping`)
    return
  }

  console.log(`Archiving events for ${label}...`)

  const events = await fetchEventsForMonth(year, month)
  console.log(`Found ${events.length} event(s)`)

  const sources = loadSources()
  let coversDownloaded = 0

  const formatted = await Promise.all(
    events.map(async (event) => {
      const endDate = event.end_time ? new Date(event.end_time) : null
      let cover = event.cover ?? null

      if (cover?.source) {
        const coverId = cover.id ?? cover.source
        const localPath = await downloadCoverImage(event.id, cover.source)
        if (!sources[event.id]) {
          sources[event.id] = coverId
          coversDownloaded++
        }
        if (localPath?.startsWith('/event-covers/')) {
          cover = { ...cover, source: localPath }
        }
      }

      return {
        id: event.id,
        name: event.name,
        description: event.description ?? '',
        start_time: event.start_time,
        end_time: event.end_time ?? null,
        formatted_date: formatDate(event.start_time),
        formatted_time: formatTime(event.start_time),
        formatted_end_time: event.end_time ? formatTime(event.end_time) : null,
        formatted_end_date: event.end_time ? formatDate(event.end_time) : null,
        is_multi_day: !!endDate && new Date(event.start_time).toDateString() !== endDate.toDateString(),
        attending_count: event.attending_count ?? 0,
        interested_count: event.interested_count ?? 0,
        place: event.place ?? null,
        cover,
        is_cancelled: event.is_canceled === true,
      }
    })
  )

  fs.mkdirSync(yearDir, { recursive: true })
  fs.writeFileSync(outPath, `${JSON.stringify(formatted, null, 2)}\n`, 'utf8')
  console.log(`Wrote ${formatted.length} event(s) to ${outPath}`)

  saveSources(sources)
  if (coversDownloaded > 0) console.log(`Downloaded ${coversDownloaded} cover(s)`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

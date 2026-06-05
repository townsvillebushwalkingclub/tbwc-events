/**
 * Fetch upcoming events from the Facebook Graph API and download any cover
 * images not yet present in public/event-covers/, or whose cover photo has
 * changed since the last sync.
 *
 * Change detection uses cover.id (Facebook photo ID), which is stable and
 * only changes when the actual cover is replaced — unlike cover.source
 * (CDN URL), whose tokens expire on every API response.
 *
 * Deleted events are not cleaned up automatically; their covers remain
 * committed so historical event pages continue to work.
 *
 * Usage (local):  npx tsx tools/sync-covers.ts
 * Usage (CI):     called by .github/workflows/sync-covers.yml
 */
import fs from 'fs'
import path from 'path'
import {
  downloadCoverImage,
  getLocalCoverPathFromFs,
} from '../lib/download-cover-image'

const SOURCES_FILE = path.join(process.cwd(), 'data', 'cover-sources.json')

type CoverSources = Record<string, string>  // eventId → cover photo id

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

interface FbEvent {
  id: string
  cover?: { source: string; id?: string } | null
}

async function fetchAllEvents(): Promise<FbEvent[]> {
  const events: FbEvent[] = []
  let url: string | null =
    `https://graph.facebook.com/v23.0/${PAGE_ID}/events` +
    `?access_token=${TOKEN}&fields=id,cover&limit=100`

  while (url) {
    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`Facebook API ${res.status}: ${await res.text()}`)
    }
    const data = (await res.json()) as {
      data: FbEvent[]
      paging?: { next?: string }
    }
    events.push(...data.data)
    url = data.paging?.next ?? null
  }
  return events
}

async function main(): Promise<void> {
  console.log('Fetching events from Facebook...')
  const events = await fetchAllEvents()
  console.log(`Found ${events.length} event(s)`)

  const sources = loadSources()
  let downloaded = 0
  let replaced = 0
  let failed = 0

  for (const event of events) {
    if (!event.cover?.source) continue

    const coverId = event.cover.id ?? event.cover.source
    const knownCoverId = sources[event.id]
    const localPath = getLocalCoverPathFromFs(event.id)

    if (knownCoverId && knownCoverId !== coverId && localPath) {
      // Cover was replaced on Facebook — delete stale file and re-download
      const absPath = path.join(process.cwd(), 'public', localPath)
      console.log(`  Cover replaced for event ${event.id} — re-downloading`)
      fs.rmSync(absPath, { force: true })
      replaced++
    } else if (localPath) {
      // Already on disk and unchanged — just record the cover id if missing
      if (!knownCoverId) sources[event.id] = coverId
      continue
    }

    const result = await downloadCoverImage(event.id, event.cover.source)
    if (result) {
      sources[event.id] = coverId
      downloaded++
    } else {
      console.warn(`  Failed to download cover for event ${event.id}`)
      failed++
    }
  }

  saveSources(sources)
  console.log(`New: ${downloaded}  Replaced: ${replaced}  Failed: ${failed}`)
  if (failed > 0) process.exit(1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

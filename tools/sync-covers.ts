/**
 * Fetch upcoming events from the Facebook Graph API and download any cover
 * images not yet present in public/event-covers/.
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
  cover?: { source: string } | null
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

  let downloaded = 0
  let failed = 0

  for (const event of events) {
    if (!event.cover?.source) continue
    if (getLocalCoverPathFromFs(event.id)) continue  // already cached

    const result = await downloadCoverImage(event.id, event.cover.source)
    if (result) {
      downloaded++
    } else {
      console.warn(`  Failed to download cover for event ${event.id}`)
      failed++
    }
  }

  console.log(`Downloaded: ${downloaded}  Failed: ${failed}`)
  if (failed > 0) process.exit(1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

/**
 * One-off repair: move events into month JSON files matching start_time (Brisbane).
 * Usage: npx tsx tools/repair-event-month-files.ts [--dry-run]
 */

import fs from 'fs'
import path from 'path'
import { getCalendarDateInTimeZone } from '../lib/event-utils'
import type { TBWCEvent } from '@/types/event'

const DATA_DIR = path.join(process.cwd(), 'data', 'events')
const dryRun = process.argv.includes('--dry-run')

function getMonthFilePath(year: number, month: number): string {
  return path.join(DATA_DIR, year.toString(), `${month.toString().padStart(2, '0')}.json`)
}

function listMonthFiles(): Array<{ year: number; month: number; path: string }> {
  const files: Array<{ year: number; month: number; path: string }> = []
  if (!fs.existsSync(DATA_DIR)) return files

  for (const yearDir of fs.readdirSync(DATA_DIR)) {
    if (!/^\d{4}$/.test(yearDir)) continue
    const year = parseInt(yearDir, 10)
    const yearPath = path.join(DATA_DIR, yearDir)
    if (!fs.statSync(yearPath).isDirectory()) continue

    for (const file of fs.readdirSync(yearPath)) {
      if (!file.endsWith('.json')) continue
      const month = parseInt(file.replace('.json', ''), 10)
      if (isNaN(month) || month < 1 || month > 12) continue
      files.push({ year, month, path: path.join(yearPath, file) })
    }
  }
  return files
}

function monthKey(year: number, month: number): string {
  return `${year}-${month}`
}

function sortEvents(events: TBWCEvent[]): TBWCEvent[] {
  return [...events].sort(
    (a, b) =>
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  )
}

function main(): void {
  const monthFiles = listMonthFiles()
  const buckets = new Map<string, TBWCEvent[]>()
  const touchedKeys = new Set<string>()
  const duplicateIds: string[] = []
  const noStartTime: Array<{ id: string; file: string }> = []
  let misplacedBefore = 0

  for (const { year, month, path: filePath } of monthFiles) {
    touchedKeys.add(monthKey(year, month))
    const rel = path.relative(process.cwd(), filePath)
    let events: TBWCEvent[]
    try {
      const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8')) as unknown
      events = Array.isArray(parsed) ? parsed : []
    } catch (err) {
      console.warn(`⚠️  Skipping unreadable ${rel}:`, err)
      continue
    }

    for (const event of events) {
      if (!event.start_time) {
        noStartTime.push({ id: event.id, file: rel })
        const key = monthKey(year, month)
        if (!buckets.has(key)) buckets.set(key, [])
        buckets.get(key)!.push(event)
        continue
      }

      const { year: ey, month: em } = getCalendarDateInTimeZone(event.start_time)
      if (ey !== year || em !== month) misplacedBefore++

      const key = monthKey(ey, em)
      touchedKeys.add(key)
      if (!buckets.has(key)) buckets.set(key, [])

      const list = buckets.get(key)!
      if (list.some((e) => e.id === event.id)) {
        duplicateIds.push(event.id)
        continue
      }
      list.push(event)
    }
  }

  for (const [, events] of buckets) {
    sortEvents(events)
  }

  const moves: Array<{ id: string; name: string; from: string; to: string }> = []

  for (const { year, month, path: filePath } of monthFiles) {
    const rel = path.relative(process.cwd(), filePath)
    const key = monthKey(year, month)
    const before = JSON.parse(fs.readFileSync(filePath, 'utf8')) as TBWCEvent[]
    const after = buckets.get(key) ?? []

    for (const event of before) {
      if (!event.start_time) continue
      const { year: ey, month: em } = getCalendarDateInTimeZone(event.start_time)
      if (ey !== year || em !== month) {
        moves.push({
          id: event.id,
          name: (event.name || '').slice(0, 50),
          from: rel,
          to: getMonthFilePath(ey, em).replace(/\\/g, '/'),
        })
      }
    }

    const beforeJson = JSON.stringify(before, null, 2)
    const afterJson = JSON.stringify(after, null, 2)
    if (beforeJson !== afterJson) {
      if (dryRun) {
        console.log(
          `Would update ${rel}: ${before.length} → ${after.length} event(s)`
        )
      } else {
        const dir = path.dirname(filePath)
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
        fs.writeFileSync(filePath, afterJson, 'utf8')
        console.log(`✅ ${rel}: ${before.length} → ${after.length} event(s)`)
      }
    }
  }

  // New month files that did not exist before
  for (const key of touchedKeys) {
    const [y, m] = key.split('-').map(Number)
    const filePath = getMonthFilePath(y, m)
    if (fs.existsSync(filePath)) continue
    const events = buckets.get(key) ?? []
    if (events.length === 0) continue
    if (dryRun) {
      console.log(`Would create ${path.relative(process.cwd(), filePath)} (${events.length} events)`)
    } else {
      const dir = path.dirname(filePath)
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
      fs.writeFileSync(filePath, JSON.stringify(events, null, 2), 'utf8')
      console.log(
        `✅ Created ${path.relative(process.cwd(), filePath)} (${events.length} events)`
      )
    }
  }

  let misplacedAfter = 0
  for (const { year, month, path: filePath } of listMonthFiles()) {
    const events = JSON.parse(fs.readFileSync(filePath, 'utf8')) as TBWCEvent[]
    for (const event of events) {
      if (!event.start_time) continue
      const { year: ey, month: em } = getCalendarDateInTimeZone(event.start_time)
      if (ey !== year || em !== month) misplacedAfter++
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log(dryRun ? '📋 Dry run summary' : '📊 Repair summary')
  console.log(`   Misplaced before: ${misplacedBefore}`)
  console.log(`   Moves:            ${moves.length}`)
  console.log(`   Misplaced after:  ${misplacedAfter}`)
  if (duplicateIds.length > 0) {
    console.log(`   Duplicate IDs skipped: ${duplicateIds.length}`)
  }
  if (noStartTime.length > 0) {
    console.log(`   No start_time (kept in source file): ${noStartTime.length}`)
  }
  console.log('='.repeat(50))

  if (misplacedAfter > 0) {
    process.exit(1)
  }
}

main()

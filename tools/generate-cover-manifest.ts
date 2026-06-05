/**
 * Build data/event-cover-manifest.json from public/event-covers.
 * Run before `next build` so OG metadata can resolve covers without fs at runtime (Vercel).
 */
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import type { CoverManifest } from '../lib/event-cover-manifest'

const COVERS_DIR = path.join(process.cwd(), 'public', 'event-covers')
const OUT_PATH = path.join(process.cwd(), 'data', 'event-cover-manifest.json')

async function main(): Promise<void> {
  if (!fs.existsSync(COVERS_DIR)) {
    fs.mkdirSync(COVERS_DIR, { recursive: true })
  }

  const manifest: CoverManifest = {}
  const files = fs.readdirSync(COVERS_DIR).filter((f) => !f.startsWith('.'))

  for (const file of files) {
    const match = file.match(/^(\d+)\.(jpg|jpeg|png|webp)$/i)
    if (!match) continue

    const eventId = match[1]
    const filePath = path.join(COVERS_DIR, file)
    let width = 1200
    let height = 630
    try {
      const meta = await sharp(filePath).metadata()
      if (meta.width && meta.height) {
        width = meta.width
        height = meta.height
      }
    } catch {
      // keep defaults
    }

    manifest[eventId] = {
      path: `/event-covers/${file}`,
      width,
      height,
    }
  }

  const sorted = Object.fromEntries(
    Object.keys(manifest).sort().map((k) => [k, manifest[k]])
  )
  fs.writeFileSync(OUT_PATH, `${JSON.stringify(sorted, null, 2)}\n`, 'utf8')
  console.log(`Wrote ${Object.keys(manifest).length} cover(s) to ${OUT_PATH}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

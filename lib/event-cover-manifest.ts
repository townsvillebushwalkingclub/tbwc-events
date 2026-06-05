import coverManifestData from '@/data/event-cover-manifest.json'

export type CoverManifestEntry = {
  path: string
  width: number
  height: number
}

export type CoverManifest = Record<string, CoverManifestEntry>

const coverManifest = coverManifestData as CoverManifest

export function getCoverFromManifest(eventId: string): CoverManifestEntry | null {
  return coverManifest[eventId] ?? null
}

import { getCoverFromManifest } from './event-cover-manifest'
import { getLocalCoverPathFromFs } from './download-cover-image'

/** Local /event-covers path (build manifest first; fs fallback for local dev). */
export function getLocalCoverPath(eventId: string): string | null {
  if (!eventId) return null
  const fromManifest = getCoverFromManifest(eventId)
  if (fromManifest) return fromManifest.path
  return getLocalCoverPathFromFs(eventId)
}

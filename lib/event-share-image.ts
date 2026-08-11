import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import {
  downloadCoverImage,
  getLocalCoverPathFromFs,
} from './download-cover-image'
import { getLocalCoverPath } from './event-cover-path'
import type { TBWCEvent } from '@/types/event'
import { getCoverFromManifest } from './event-cover-manifest'
import { absoluteEventCoverRouteUrl, absoluteEventShareImageUrl } from './site'

export type EventShareImage = {
  url: string
  width: number
  height: number
}

/** Ensure cover is stored under public/event-covers; returns local path or null. */
export async function ensureLocalCoverPath(
  eventId: string,
  remoteSource?: string | null
): Promise<string | null> {
  const existing = getLocalCoverPath(eventId)
  if (existing) return existing

  const source = remoteSource?.trim()
  if (!source) return null
  if (source.startsWith('/event-covers/')) return source

  await downloadCoverImage(eventId, source)
  return getLocalCoverPathFromFs(eventId)
}

export async function getLocalCoverDimensions(
  localPath: string
): Promise<{ width: number; height: number } | null> {
  const relative = localPath.replace(/^\//, '')
  const filePath = path.join(process.cwd(), 'public', relative)
  if (!fs.existsSync(filePath)) return null
  try {
    const meta = await sharp(filePath).metadata()
    if (meta.width && meta.height) {
      return { width: meta.width, height: meta.height }
    }
  } catch {
    return null
  }
  return null
}

/** Share image from manifest or disk (no network download). */
export function resolveEventShareImageFromDisk(
  eventId: string
): EventShareImage | null {
  return resolveEventShareImageForMetadata(eventId, null)
}

/** Absolute share image on events.townsvillebushwalkingclub.com (never Facebook CDN). */
export async function resolveEventShareImage(
  eventId: string,
  coverSource?: string | null
): Promise<EventShareImage | null> {
  const localPath = await ensureLocalCoverPath(eventId, coverSource)
  if (!localPath) return null

  const url = absoluteEventShareImageUrl(localPath)
  if (!url) return null

  const dims = await getLocalCoverDimensions(localPath)
  return {
    url,
    width: dims?.width ?? 1200,
    height: dims?.height ?? 630,
  }
}

/** Prefer a self-hosted cover on the event record when the file exists on disk. */
export function applyLocalCoverToEvent(event: TBWCEvent): TBWCEvent {
  if (!event.cover?.source) return event
  const local = getLocalCoverPath(event.id)
  if (local) return { ...event, cover: { ...event.cover, source: local } }
  return event
}

/**
 * Open Graph image on events.townsvillebushwalkingclub.com (never Facebook CDN).
 * Prefers the build-time manifest; otherwise a stable /events/{id}/cover URL
 * that proxies the Facebook cover when no committed file exists.
 */
export function resolveEventShareImageForMetadata(
  eventId: string,
  coverSource?: string | null
): EventShareImage | null {
  const fromManifest = getCoverFromManifest(eventId)
  if (fromManifest) {
    const url = absoluteEventShareImageUrl(fromManifest.path)
    if (url) {
      return {
        url,
        width: fromManifest.width,
        height: fromManifest.height,
      }
    }
  }

  const localSource = coverSource?.trim()
  if (localSource?.startsWith('/event-covers/')) {
    const url = absoluteEventShareImageUrl(localSource)
    if (url) return { url, width: 1200, height: 630 }
  }

  // Local dev fallback when manifest hasn't been generated yet (no-op on Vercel)
  const localPath = getLocalCoverPathFromFs(eventId)
  if (localPath) {
    const url = absoluteEventShareImageUrl(localPath)
    if (url) return { url, width: 1200, height: 630 }
  }

  if (localSource) {
    return {
      url: absoluteEventCoverRouteUrl(eventId),
      width: 1200,
      height: 630,
    }
  }

  return null
}

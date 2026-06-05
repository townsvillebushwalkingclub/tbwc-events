import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import {
  downloadCoverImage,
  getLocalCoverPath,
} from './download-cover-image'
import type { TBWCEvent } from '@/types/event'
import { absoluteEventShareImageUrl } from './site'

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
  return getLocalCoverPath(eventId)
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

/** Share image from an on-disk cover only (no network download). */
export function resolveEventShareImageFromDisk(
  eventId: string
): EventShareImage | null {
  const localPath = getLocalCoverPath(eventId)
  if (!localPath) return null
  const url = absoluteEventShareImageUrl(localPath)
  if (!url) return null
  return { url, width: 1200, height: 630 }
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

/** Open Graph image from a committed /event-covers file (no network I/O). */
export async function resolveEventShareImageForMetadata(
  eventId: string
): Promise<EventShareImage | null> {
  const localPath = getLocalCoverPath(eventId)
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

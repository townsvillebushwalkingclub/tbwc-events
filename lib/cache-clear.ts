import { revalidatePath, revalidateTag } from 'next/cache'
import {
  FACEBOOK_EVENTS_CACHE_TAG,
  facebookEventCacheTag,
} from '@/lib/cache-constants'
import { clearEventsCache } from '@/lib/facebook-api'

export interface ClearFacebookCacheOptions {
  eventId?: string
  year?: number
  month?: number
}

const SHARED_PATHS = [
  '/',
  '/events/all',
  '/api/events',
  '/api/events/search',
  '/api/embed-snippet',
  '/api/calendar/feed',
  '/llms.txt',
  '/sitemap.xml',
  '/poster',
] as const

export async function clearFacebookEventCaches(
  options: ClearFacebookCacheOptions = {}
): Promise<{ cleared: string[] }> {
  clearEventsCache()

  const cleared: string[] = []

  revalidateTag(FACEBOOK_EVENTS_CACHE_TAG, { expire: 0 })
  cleared.push(`tag:${FACEBOOK_EVENTS_CACHE_TAG}`)

  if (options.eventId) {
    const eventTag = facebookEventCacheTag(options.eventId)
    revalidateTag(eventTag, { expire: 0 })
    cleared.push(`tag:${eventTag}`)

    for (const path of [
      `/events/${options.eventId}`,
      `/api/event/${options.eventId}`,
      `/api/event/${options.eventId}/calendar`,
    ]) {
      revalidatePath(path)
      cleared.push(path)
    }
  }

  for (const path of SHARED_PATHS) {
    revalidatePath(path)
    cleared.push(path)
  }

  if (
    options.year != null &&
    options.month != null &&
    options.month >= 1 &&
    options.month <= 12
  ) {
    const monthApiPath = `/api/events/${options.year}/${options.month}`
    revalidatePath(monthApiPath)
    cleared.push(monthApiPath)

    const posterPath = `/poster/${options.year}-${String(options.month).padStart(2, '0')}`
    revalidatePath(posterPath)
    cleared.push(posterPath)
  }

  return { cleared }
}

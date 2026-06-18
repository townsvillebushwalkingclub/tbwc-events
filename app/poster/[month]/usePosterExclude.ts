'use client'

import { useMemo, useSyncExternalStore } from 'react'
import { parsePosterExcludeParam } from '@/lib/poster-exclude'
import type { TBWCEvent } from '@/types/event'

const EMPTY_EXCLUDE_SNAPSHOT = ''

function getExcludeSnapshot(): string {
  if (typeof window === 'undefined') return EMPTY_EXCLUDE_SNAPSHOT
  const raw = new URLSearchParams(window.location.search).get('exclude')
  const ids = parsePosterExcludeParam(raw ?? undefined)
  if (ids.size === 0) return EMPTY_EXCLUDE_SNAPSHOT
  return [...ids].sort().join(',')
}

function subscribeExcludeIds(onStoreChange: () => void): () => void {
  window.addEventListener('popstate', onStoreChange)
  return () => window.removeEventListener('popstate', onStoreChange)
}

export function usePosterExcludeIds(): Set<string> {
  const snapshot = useSyncExternalStore(
    subscribeExcludeIds,
    getExcludeSnapshot,
    () => EMPTY_EXCLUDE_SNAPSHOT
  )

  return useMemo(() => {
    if (!snapshot) return new Set<string>()
    return new Set(snapshot.split(','))
  }, [snapshot])
}

export function filterPosterExcludedEvents(
  events: TBWCEvent[],
  excludeIds: Set<string>
): TBWCEvent[] {
  if (excludeIds.size === 0) return events
  return events.filter((event) => !excludeIds.has(event.id))
}

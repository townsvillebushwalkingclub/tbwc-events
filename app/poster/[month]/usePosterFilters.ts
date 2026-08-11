'use client'

import { useMemo, useSyncExternalStore } from 'react'
import {
  moveFeaturedFirst,
  parsePosterExcludeParam,
  parsePosterFeaturedParam,
  parsePosterIncludeParam,
} from '@/lib/poster-query'
import type { TBWCEvent } from '@/types/event'

export { moveFeaturedFirst }

const EMPTY_FILTER_SNAPSHOT = '|'

interface PosterFilterSnapshot {
  excludeIds: Set<string>
  includeIds: Set<string>
  featuredId: string | null
}

function getFilterSnapshot(): string {
  if (typeof window === 'undefined') return EMPTY_FILTER_SNAPSHOT
  const params = new URLSearchParams(window.location.search)
  const excludeIds = parsePosterExcludeParam(
    params.get('exclude') ?? undefined
  )
  const includeIds = parsePosterIncludeParam(
    params.get('include') ?? undefined
  )
  const featuredId = parsePosterFeaturedParam(
    params.get('featured') ?? undefined
  )
  const excludePart =
    excludeIds.size > 0 ? [...excludeIds].sort().join(',') : ''
  const includePart =
    includeIds.size > 0 ? [...includeIds].sort().join(',') : ''
  const featuredPart = featuredId ?? ''
  return `${includePart}|${excludePart}|${featuredPart}`
}

function subscribeFilterIds(onStoreChange: () => void): () => void {
  window.addEventListener('popstate', onStoreChange)
  return () => window.removeEventListener('popstate', onStoreChange)
}

function parseFilterSnapshot(snapshot: string): PosterFilterSnapshot {
  const [includePart = '', excludePart = '', featuredPart = ''] =
    snapshot.split('|')
  return {
    includeIds: includePart
      ? new Set(includePart.split(','))
      : new Set<string>(),
    excludeIds: excludePart
      ? new Set(excludePart.split(','))
      : new Set<string>(),
    featuredId: featuredPart || null,
  }
}

export function usePosterFilters(): PosterFilterSnapshot {
  const snapshot = useSyncExternalStore(
    subscribeFilterIds,
    getFilterSnapshot,
    () => EMPTY_FILTER_SNAPSHOT
  )

  return useMemo(() => parseFilterSnapshot(snapshot), [snapshot])
}

export function filterPosterExcludedEvents(
  events: TBWCEvent[],
  excludeIds: Set<string>
): TBWCEvent[] {
  if (excludeIds.size === 0) return events
  return events.filter((event) => !excludeIds.has(event.id))
}

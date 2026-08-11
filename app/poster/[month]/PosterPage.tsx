'use client'

import { useMemo } from 'react'
import { formatPosterFilterQuery } from '@/lib/poster-query'
import { formatPosterNextMonthLine } from '@/lib/poster-format'
import { PosterThemeProvider } from './PosterThemeProvider'
import PosterContent from './PosterContent'
import PosterToolbar from './PosterToolbar'
import type { PosterAiDownloadProps } from './PosterAiDownloadButton'
import type { PosterMonth } from '@/lib/poster-month'
import type { TBWCEvent } from '@/types/event'
import {
  filterPosterExcludedEvents,
  moveFeaturedFirst,
  usePosterFilters,
} from './usePosterFilters'

export interface PosterPageProps {
  prev: PosterMonth
  next: PosterMonth
  aiDownload: PosterAiDownloadProps
  anchorLabel: string
  currentEvents: TBWCEvent[]
  nextEvents: TBWCEvent[]
  nextMonthLabel: string
  currentMonthLink?: { href: string; label: string } | null
}

export default function PosterPage({
  prev,
  next,
  aiDownload,
  anchorLabel,
  currentEvents,
  nextEvents,
  nextMonthLabel,
  currentMonthLink = null,
}: PosterPageProps) {
  const { excludeIds, includeIds, featuredId } = usePosterFilters()
  const filterQuery = formatPosterFilterQuery({
    excludeIds,
    includeIds,
    featuredId,
  })

  const filteredCurrentEvents = useMemo(
    () =>
      moveFeaturedFirst(
        filterPosterExcludedEvents(currentEvents, excludeIds),
        featuredId
      ),
    [currentEvents, excludeIds, featuredId]
  )
  const filteredNextEvents = useMemo(
    () => filterPosterExcludedEvents(nextEvents, excludeIds),
    [nextEvents, excludeIds]
  )
  const filteredAiDownload = useMemo((): PosterAiDownloadProps => {
    const featuredCurrent = moveFeaturedFirst(
      aiDownload.currentEvents.filter((event) => !excludeIds.has(event.id)),
      featuredId
    )
    return {
      ...aiDownload,
      currentEvents: featuredCurrent,
      nextEvents: filteredNextEvents.map((event) => ({
        name: event.name,
        dateLine: formatPosterNextMonthLine(event),
      })),
    }
  }, [aiDownload, excludeIds, featuredId, filteredNextEvents])

  return (
    <PosterThemeProvider>
      <PosterToolbar
        prev={prev}
        next={next}
        filterQuery={filterQuery}
        aiDownload={filteredAiDownload}
      />
      <PosterContent
        anchorLabel={anchorLabel}
        currentEvents={filteredCurrentEvents}
        nextEvents={filteredNextEvents}
        nextMonthLabel={nextMonthLabel}
        currentMonthLink={currentMonthLink}
      />
    </PosterThemeProvider>
  )
}

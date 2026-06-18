'use client'

import { useMemo } from 'react'
import { formatPosterExcludeQuery } from '@/lib/poster-exclude'
import { formatPosterNextMonthLine } from '@/lib/poster-format'
import { PosterThemeProvider } from './PosterThemeProvider'
import PosterContent from './PosterContent'
import PosterToolbar from './PosterToolbar'
import type { PosterAiDownloadProps } from './PosterAiDownloadButton'
import type { PosterMonth } from '@/lib/poster-month'
import type { TBWCEvent } from '@/types/event'
import {
  filterPosterExcludedEvents,
  usePosterExcludeIds,
} from './usePosterExclude'

export interface PosterPageProps {
  prev: PosterMonth
  next: PosterMonth
  aiDownload: PosterAiDownloadProps
  anchorLabel: string
  currentEvents: TBWCEvent[]
  nextEvents: TBWCEvent[]
  nextMonthLabel: string
}

export default function PosterPage({
  prev,
  next,
  aiDownload,
  anchorLabel,
  currentEvents,
  nextEvents,
  nextMonthLabel,
}: PosterPageProps) {
  const excludeIds = usePosterExcludeIds()
  const excludeQuery = formatPosterExcludeQuery(excludeIds)

  const filteredCurrentEvents = useMemo(
    () => filterPosterExcludedEvents(currentEvents, excludeIds),
    [currentEvents, excludeIds]
  )
  const filteredNextEvents = useMemo(
    () => filterPosterExcludedEvents(nextEvents, excludeIds),
    [nextEvents, excludeIds]
  )
  const filteredAiDownload = useMemo(
    (): PosterAiDownloadProps => ({
      ...aiDownload,
      currentEvents: aiDownload.currentEvents.filter(
        (event) => !excludeIds.has(event.id)
      ),
      nextEvents: filteredNextEvents.map((event) => ({
        name: event.name,
        dateLine: formatPosterNextMonthLine(event),
      })),
    }),
    [aiDownload, excludeIds, filteredNextEvents]
  )

  return (
    <PosterThemeProvider>
      <PosterToolbar
        prev={prev}
        next={next}
        excludeQuery={excludeQuery}
        aiDownload={filteredAiDownload}
      />
      <PosterContent
        anchorLabel={anchorLabel}
        currentEvents={filteredCurrentEvents}
        nextEvents={filteredNextEvents}
        nextMonthLabel={nextMonthLabel}
      />
    </PosterThemeProvider>
  )
}

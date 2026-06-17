'use client'

import { PosterThemeProvider } from './PosterThemeProvider'
import PosterContent from './PosterContent'
import PosterToolbar from './PosterToolbar'
import type { PosterAiDownloadProps } from './PosterAiDownloadButton'
import type { PosterMonth } from '@/lib/poster-month'
import type { PosterThemeId } from '@/lib/poster-themes'
import type { TBWCEvent } from '@/types/event'

export interface PosterPageProps {
  prev: PosterMonth
  next: PosterMonth
  excludeQuery: string
  initialTheme: PosterThemeId | null
  aiDownload: PosterAiDownloadProps
  anchorLabel: string
  currentEvents: TBWCEvent[]
  nextEvents: TBWCEvent[]
  nextMonthLabel: string
}

export default function PosterPage({
  prev,
  next,
  excludeQuery,
  initialTheme,
  aiDownload,
  anchorLabel,
  currentEvents,
  nextEvents,
  nextMonthLabel,
}: PosterPageProps) {
  return (
    <PosterThemeProvider initialTheme={initialTheme}>
      <PosterToolbar
        prev={prev}
        next={next}
        excludeQuery={excludeQuery}
        aiDownload={aiDownload}
      />
      <PosterContent
        anchorLabel={anchorLabel}
        currentEvents={currentEvents}
        nextEvents={nextEvents}
        nextMonthLabel={nextMonthLabel}
      />
    </PosterThemeProvider>
  )
}

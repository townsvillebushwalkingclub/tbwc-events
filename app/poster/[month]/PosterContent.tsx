'use client'

import { posterLayoutClassName, posterIsSparseMonth } from '@/lib/poster-layout'
import { posterThemeClassName } from '@/lib/poster-themes'
import type { TBWCEvent } from '@/types/event'
import PosterBottom from './PosterBottom'
import PosterDecorations from './PosterDecorations'
import PosterEventsArea from './PosterEventsArea'
import PosterHeader from './PosterHeader'
import { usePosterTheme } from './PosterThemeProvider'

interface PosterContentProps {
  anchorLabel: string
  currentEvents: TBWCEvent[]
  nextEvents: TBWCEvent[]
  nextMonthLabel: string
}

export default function PosterContent({
  anchorLabel,
  currentEvents,
  nextEvents,
  nextMonthLabel,
}: PosterContentProps) {
  const { theme } = usePosterTheme()
  const sparseClass = posterIsSparseMonth(currentEvents.length)
    ? ' poster-page--sparse'
    : ''

  return (
    <main
      className={`poster-page ${posterLayoutClassName(currentEvents.length)}${sparseClass} ${posterThemeClassName(theme)}`}
      aria-label="Townsville Bushwalking Club events poster"
    >
      <PosterHeader anchorLabel={anchorLabel} />
      <section className="poster-main" aria-label={`Events in ${anchorLabel}`}>
        <PosterEventsArea
          anchorLabel={anchorLabel}
          currentEvents={currentEvents}
        />
      </section>
      <PosterBottom
        nextMonthLabel={nextMonthLabel}
        nextEvents={nextEvents}
      />
      {theme === 'nature' && <PosterDecorations />}
    </main>
  )
}

'use client'

import Link from 'next/link'
import {
  getPosterEventsLayout,
  posterGridClassName,
  posterHeroSplitGridClassName,
  posterUsesFeaturedFirstEvent,
} from '@/lib/poster-layout'
import type { TBWCEvent } from '@/types/event'
import { usePosterTheme } from './PosterThemeProvider'
import PosterEventCard from './PosterEventCard'
import PosterSectionDivider from './PosterSectionDivider'

interface PosterEventsAreaProps {
  anchorLabel: string
  currentEvents: TBWCEvent[]
  /** When set, empty past-month posters suggest viewing this month instead. */
  currentMonthLink?: { href: string; label: string } | null
}

function monthNameFromLabel(anchorLabel: string): string {
  return anchorLabel.replace(/\s+\d{4}$/, '').trim() || anchorLabel
}

export default function PosterEventsArea({
  anchorLabel,
  currentEvents,
  currentMonthLink = null,
}: PosterEventsAreaProps) {
  const { theme } = usePosterTheme()
  const eventsLayout = getPosterEventsLayout(theme, currentEvents.length)
  const { layout, displayMode, showSectionDivider } = eventsLayout

  if (displayMode === 'empty') {
    return (
      <div className="poster-empty">
        {currentMonthLink ? (
          <p className="poster-empty-notice no-print" role="status">
            This month has passed.{' '}
            <Link href={currentMonthLink.href} className="poster-empty-notice-link">
              View the {currentMonthLink.label} poster
            </Link>{' '}
            instead.
          </p>
        ) : (
          <p className="poster-empty-message">
            No upcoming events scheduled this month.
          </p>
        )}
      </div>
    )
  }

  const showDescription = layout.showDescription
  const useFeatureDate = layout.showDescription

  if (displayMode === 'hero-split') {
    const heroEvent = currentEvents[0]
    const gridEvents = currentEvents.slice(1)
    const gridClass = posterHeroSplitGridClassName(gridEvents.length)

    return (
      <div
        className={`poster-events-hero-split poster-events-hero-split--n${currentEvents.length}`}
      >
        <div className="poster-events-hero">
          <PosterEventCard
            event={heroEvent}
            showDescription={showDescription}
            useFeatureDate={useFeatureDate}
            featured
            heroOverlay={theme === 'nature'}
          />
        </div>
        {showSectionDivider && (
          <PosterSectionDivider
            label={`More ${monthNameFromLabel(anchorLabel)} Walks & Events`}
          />
        )}
        <div className={gridClass}>
          {gridEvents.map((event) => (
            <PosterEventCard
              key={event.id}
              event={event}
              showDescription={false}
              useFeatureDate={false}
            />
          ))}
        </div>
      </div>
    )
  }

  if (displayMode === 'stack') {
    return (
      <div className="poster-events-stack">
        {currentEvents.map((event) => (
          <PosterEventCard
            key={event.id}
            event={event}
            showDescription={showDescription}
            useFeatureDate={useFeatureDate}
            featured={theme === 'nature'}
            heroOverlay={theme === 'nature'}
          />
        ))}
      </div>
    )
  }

  return (
    <div className={posterGridClassName(layout)}>
      {currentEvents.map((event, index) => (
        <PosterEventCard
          key={event.id}
          event={event}
          showDescription={showDescription}
          useFeatureDate={useFeatureDate}
          featured={
            posterUsesFeaturedFirstEvent(layout, theme) && index === 0
          }
        />
      ))}
    </div>
  )
}

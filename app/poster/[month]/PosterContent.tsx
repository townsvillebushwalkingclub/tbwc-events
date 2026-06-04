import type { PosterDensity } from '@/lib/poster-utils'
import { showPosterDescription } from '@/lib/poster-utils'
import type { TBWCEvent } from '@/types/event'
import PosterEventCard from './PosterEventCard'
import PosterNextMonth from './PosterNextMonth'
import PosterQr from './PosterQr'

interface PosterContentProps {
  anchorLabel: string
  currentEvents: TBWCEvent[]
  nextEvents: TBWCEvent[]
  nextMonthLabel: string
  density: PosterDensity
}

function gridClass(density: PosterDensity): string {
  if (density === 'mosaic') return 'poster-events-grid poster-events-grid--mosaic'
  if (density === 'balanced') return 'poster-events-grid'
  return 'poster-events-stack'
}

export default function PosterContent({
  anchorLabel,
  currentEvents,
  nextEvents,
  nextMonthLabel,
  density,
}: PosterContentProps) {
  const showDescription = showPosterDescription(currentEvents.length)

  return (
    <main
      className={`poster-page poster-page--density-${density}`}
      aria-label="Townsville Bushwalking Club events poster"
    >
      <header className="poster-header">
        <div className="poster-header-row">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/townsville-bushwalking-club-logo.png"
            alt="Townsville Bushwalking Club"
            className="poster-logo"
            width={200}
            height={44}
          />
          <div className="poster-header-text">
            <h1 className="poster-title">Townsville Bushwalking Club</h1>
            <p className="poster-subtitle">
              Walks, adventures &amp; social events
            </p>
          </div>
          <p className="poster-month-badge">{anchorLabel}</p>
        </div>
      </header>

      <section className="poster-main" aria-label={`Events in ${anchorLabel}`}>
        {currentEvents.length === 0 ? (
          <p className="poster-empty">No upcoming events scheduled this month.</p>
        ) : (
          <div className={gridClass(density)}>
            {currentEvents.map((event) => (
              <PosterEventCard
                key={event.id}
                event={event}
                density={density}
                showDescription={showDescription}
              />
            ))}
          </div>
        )}
      </section>

      <div className="poster-bottom">
        <PosterNextMonth label={nextMonthLabel} events={nextEvents} />
        <footer className="poster-footer">
          <div className="poster-footer-text">
            <p className="poster-footer-cta">Full details &amp; RSVP</p>
            <p className="poster-footer-url">townsvillebushwalkingclub.com/calendar/</p>
          </div>
          <PosterQr />
        </footer>
      </div>
    </main>
  )
}

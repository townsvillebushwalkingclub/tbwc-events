import {
  getPosterLayout,
  posterGridClassName,
  posterLayoutClassName,
  posterUsesFeaturedFirstEvent,
} from '@/lib/poster-layout'
import { POSTER_QR_URL } from '@/lib/poster-constants'
import type { TBWCEvent } from '@/types/event'
import PosterEventCard from './PosterEventCard'
import PosterNextMonth from './PosterNextMonth'
import PosterQr from './PosterQr'

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
  const layout = getPosterLayout(currentEvents.length)
  const useStack = currentEvents.length > 0 && currentEvents.length < 4

  return (
    <main
      className={`poster-page ${posterLayoutClassName(currentEvents.length)}${useStack ? ' poster-page--sparse' : ''}`}
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
          <div
            className={
              useStack
                ? 'poster-events-stack'
                : posterGridClassName(layout)
            }
          >
            {currentEvents.map((event, index) => (
              <PosterEventCard
                key={event.id}
                event={event}
                showDescription={layout.showDescription}
                useFeatureDate={layout.showDescription}
                featured={posterUsesFeaturedFirstEvent(layout) && index === 0}
              />
            ))}
          </div>
        )}
      </section>

      <div className="poster-bottom">
        <PosterNextMonth label={nextMonthLabel} events={nextEvents} />
        <footer className="poster-footer">
          <a
            href={POSTER_QR_URL}
            className="poster-footer-link"
            aria-label="Full event details and RSVP on townsvillebushwalkingclub.com"
          >
            <p className="poster-footer-cta">Full details &amp; RSVP</p>
            <p className="poster-footer-url">townsvillebushwalkingclub.com/calendar/</p>
          </a>
          <PosterQr />
        </footer>
      </div>
    </main>
  )
}

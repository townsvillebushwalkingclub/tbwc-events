import { absoluteEventPageUrl } from '@/lib/site'
import type { TBWCEvent } from '@/types/event'
import {
  formatPosterDateTime,
  formatPosterFeatureDate,
  truncatePosterDescription,
} from '@/lib/poster-format'

interface PosterEventCardProps {
  event: TBWCEvent
  showDescription: boolean
  useFeatureDate?: boolean
  featured?: boolean
  heroOverlay?: boolean
}

function EventCover({ event }: { event: TBWCEvent }) {
  if (event.cover?.source) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={event.cover.source} alt="" className="poster-event-cover" />
    )
  }

  return (
    <div className="poster-event-cover poster-event-cover--placeholder" aria-hidden>
      <span className="poster-event-cover-icon">🏔️</span>
    </div>
  )
}

export default function PosterEventCard({
  event,
  showDescription,
  useFeatureDate = false,
  featured = false,
  heroOverlay = false,
}: PosterEventCardProps) {
  const dateLine = useFeatureDate
    ? formatPosterFeatureDate(event)
    : formatPosterDateTime(event)
  const desc =
    showDescription && event.description
      ? truncatePosterDescription(event.description)
      : null
  const href = absoluteEventPageUrl(event.id)

  return (
    <a
      href={href}
      className={`poster-card poster-event poster-event-link${featured ? ' poster-event--featured' : ''}${heroOverlay ? ' poster-event--hero-overlay' : ''}`}
      aria-label={`${event.name} — view event details`}
    >
      <div className="poster-event-media">
        <EventCover event={event} />
        {heroOverlay && (
          <div className="poster-event-hero-overlay">
            <h3 className="poster-event-hero-name">{event.name}</h3>
            <p className="poster-event-hero-date">
              <span className="poster-event-hero-calendar" aria-hidden>
                📅
              </span>
              {dateLine}
            </p>
          </div>
        )}
        {heroOverlay && (
          <div className="poster-event-hero-badge" aria-hidden>
            🥾
          </div>
        )}
      </div>
      <div className={`poster-card-body${heroOverlay ? ' poster-card-body--hero' : ''}`}>
        {!heroOverlay && (
          <>
            <h3 className="poster-event-name">{event.name}</h3>
            <p className="poster-event-date">{dateLine}</p>
          </>
        )}
        {desc && <p className="poster-event-desc">{desc}</p>}
      </div>
    </a>
  )
}

import { absoluteEventPageUrl } from '@/lib/site'
import type { TBWCEvent } from '@/types/event'
import {
  extractPosterEventContact,
  stripPosterContactLines,
} from '@/lib/poster-description-parse'
import {
  formatPosterDateTime,
  formatPosterFeatureDate,
  truncatePosterDescription,
} from '@/lib/poster-format'
import PosterEventContact from './PosterEventContact'
import {
  PosterHeroCalendarIcon,
  PosterHikerIcon,
  PosterMountainIcon,
} from './PosterIcons'

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
      <PosterMountainIcon className="poster-event-cover-icon" />
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
  const contact = extractPosterEventContact(event.description)
  const desc =
    showDescription && event.description
      ? truncatePosterDescription(stripPosterContactLines(event.description))
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
              <PosterHeroCalendarIcon className="poster-event-hero-calendar" />
              {dateLine}
            </p>
            <PosterEventContact contact={contact} variant="hero" />
          </div>
        )}
        {heroOverlay && (
          <div className="poster-event-hero-badge" aria-hidden>
            <PosterHikerIcon className="poster-event-hero-badge-icon" />
          </div>
        )}
      </div>
      <div className={`poster-card-body${heroOverlay ? ' poster-card-body--hero' : ''}`}>
        {!heroOverlay && (
          <>
            <p className="poster-event-date">{dateLine}</p>
            <h3 className="poster-event-name">{event.name}</h3>
          </>
        )}
        {!heroOverlay && (
          <PosterEventContact contact={contact} />
        )}
        {desc && <p className="poster-event-desc">{desc}</p>}
      </div>
    </a>
  )
}

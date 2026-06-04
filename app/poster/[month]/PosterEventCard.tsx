import type { TBWCEvent } from '@/types/event'
import type { PosterDensity } from '@/lib/poster-utils'
import {
  formatPosterDateTime,
  formatPosterFeatureDate,
  truncatePosterDescription,
} from '@/lib/poster-utils'

interface PosterEventCardProps {
  event: TBWCEvent
  density: PosterDensity
  showDescription: boolean
}

function EventCover({
  event,
  density,
}: {
  event: TBWCEvent
  density: PosterDensity
}) {
  const className = `poster-event-cover poster-event-cover--${density}`

  if (event.cover?.source) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={event.cover.source} alt="" className={className} />
    )
  }

  return (
    <div className={`${className} poster-event-cover--placeholder`} aria-hidden>
      <span className="poster-event-cover-icon">🏔️</span>
    </div>
  )
}

export default function PosterEventCard({
  event,
  density,
  showDescription,
}: PosterEventCardProps) {
  const dateLine =
    density === 'feature'
      ? formatPosterFeatureDate(event)
      : formatPosterDateTime(event)
  const desc =
    showDescription && event.description
      ? truncatePosterDescription(event.description)
      : null

  return (
    <article
      className={`poster-card poster-event poster-event--${density}`}
    >
      <EventCover event={event} density={density} />
      <div className="poster-card-body">
        <h3 className="poster-event-name">{event.name}</h3>
        <p className="poster-event-date">{dateLine}</p>
        {desc && <p className="poster-event-desc">{desc}</p>}
      </div>
    </article>
  )
}

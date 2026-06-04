import { absoluteEventPageUrl } from '@/lib/site'
import type { TBWCEvent } from '@/types/event'
import {
  formatPosterDateTime,
  formatPosterFeatureDate,
  truncatePosterDescription,
} from '@/lib/poster-utils'

interface PosterEventCardProps {
  event: TBWCEvent
  showDescription: boolean
  useFeatureDate?: boolean
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
      className="poster-card poster-event poster-event-link"
      aria-label={`${event.name} — view event details`}
    >
      <EventCover event={event} />
      <div className="poster-card-body">
        <h3 className="poster-event-name">{event.name}</h3>
        <p className="poster-event-date">{dateLine}</p>
        {desc && <p className="poster-event-desc">{desc}</p>}
      </div>
    </a>
  )
}

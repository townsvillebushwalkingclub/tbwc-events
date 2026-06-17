import { POSTER_LEAF_14_PATH } from '@/lib/poster-constants'
import { absoluteEventPageUrl } from '@/lib/site'
import { formatPosterNextMonthLine } from '@/lib/poster-format'
import type { TBWCEvent } from '@/types/event'

interface PosterNextMonthProps {
  label: string
  events: TBWCEvent[]
}

export default function PosterNextMonth({ label, events }: PosterNextMonthProps) {
  if (events.length === 0) return null

  return (
    <aside className="poster-next-month" aria-label={`Coming up in ${label}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={POSTER_LEAF_14_PATH}
        alt=""
        className="poster-next-month-leaf"
        aria-hidden
      />
      <div className="poster-next-month-content">
        <p className="poster-next-month-title">
          <span className="poster-next-month-label">Next:</span> {label}
        </p>
        <ul className="poster-next-month-list">
          {events.map((event) => (
            <li key={event.id}>
              <a
                href={absoluteEventPageUrl(event.id)}
                className="poster-next-month-link"
              >
                {formatPosterNextMonthLine(event)}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}

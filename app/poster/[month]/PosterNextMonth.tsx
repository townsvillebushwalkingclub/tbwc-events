import { formatPosterNextMonthLine } from '@/lib/poster-utils'
import type { TBWCEvent } from '@/types/event'

interface PosterNextMonthProps {
  label: string
  events: TBWCEvent[]
}

export default function PosterNextMonth({ label, events }: PosterNextMonthProps) {
  if (events.length === 0) return null

  return (
    <aside className="poster-next-month" aria-label={`Coming up in ${label}`}>
      <p className="poster-next-month-title">
        <span className="poster-next-month-label">Next:</span> {label}
      </p>
      <ul className="poster-next-month-list">
        {events.map((event) => (
          <li key={event.id}>{formatPosterNextMonthLine(event)}</li>
        ))}
      </ul>
    </aside>
  )
}

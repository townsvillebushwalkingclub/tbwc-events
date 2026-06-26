import { validateEventDetailApiAccess } from '@/lib/event-api-access'
import { parseFacebookEventDate } from '@/lib/event-utils'
import type { TBWCEvent } from '@/types/event'

export type EventNeighbor = Pick<TBWCEvent, 'id' | 'name' | 'formatted_date'>

function toNeighbor(event: TBWCEvent): EventNeighbor {
  return {
    id: event.id,
    name: event.name,
    formatted_date: event.formatted_date,
  }
}

export function getAdjacentEvents(
  events: TBWCEvent[],
  currentId: string,
  now = new Date()
): { previous: EventNeighbor | null; next: EventNeighbor | null } {
  const eligible = events
    .filter(
      (event) =>
        event.id &&
        event.start_time &&
        validateEventDetailApiAccess(event, now).ok
    )
    .sort((a, b) => {
      const timeDiff =
        parseFacebookEventDate(a.start_time).getTime() -
        parseFacebookEventDate(b.start_time).getTime()
      if (timeDiff !== 0) return timeDiff
      return a.id.localeCompare(b.id)
    })

  const idx = eligible.findIndex((event) => event.id === currentId)
  if (idx < 0) return { previous: null, next: null }

  return {
    previous: idx > 0 ? toNeighbor(eligible[idx - 1]) : null,
    next: idx < eligible.length - 1 ? toNeighbor(eligible[idx + 1]) : null,
  }
}

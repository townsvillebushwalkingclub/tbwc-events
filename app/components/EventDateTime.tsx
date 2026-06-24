import { isMultiDayEvent } from '@/lib/event-utils'
import type { TBWCEvent } from '@/types/event'

interface EventDateTimeProps {
  event: TBWCEvent
  className?: string
  textSize?: string
}

export function EventDateTime({
  event,
  className = '',
  textSize = 'text-lg',
}: EventDateTimeProps) {
  const isMultiDay = isMultiDayEvent(event)

  if (isMultiDay) {
    return (
      <div
        className={`text-gray-800 font-semibold ${textSize} mb-2 flex items-center gap-2 ${className}`}
      >
        <span className="text-sky">📅</span>
        <span>
          {event.formatted_date} {event.formatted_time} to <br />
          {event.formatted_end_date}{' '}
          {event.formatted_end_time || event.formatted_time}
        </span>
      </div>
    )
  }
  return (
    <div
      className={`text-gray-800 font-semibold ${textSize} flex items-center gap-2 ${className}`}
    >
      <span className="text-sky">📅</span>
      <span>
        {event.formatted_date} {event.formatted_time}
        {event.formatted_end_time ? ` - ${event.formatted_end_time}` : ''}
      </span>
    </div>
  )
}

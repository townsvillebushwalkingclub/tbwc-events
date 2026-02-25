/**
 * Shared component for displaying event date and time
 * Handles both single-day and multi-day events
 */

/**
 * EventDateTime component for React
 * @param {Object} props
 * @param {Object} props.event - Event object with formatted_date, formatted_time, etc.
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.textSize - Text size class (default: 'text-lg')
 */
export function EventDateTime({ event, className = '', textSize = 'text-lg' }) {
    const isMultiDay = !!(
        event.formatted_end_date &&
        event.formatted_end_date !== event.formatted_date
    )

    if (isMultiDay) {
        return (
            <div className={`text-gray-800 font-semibold ${textSize} mb-2 flex items-center gap-2 ${className}`}>
                <span className="text-sky">📅</span>
                <span>
                    {event.formatted_date} {event.formatted_time} to <br />
                    {event.formatted_end_date}{' '}
                    {event.formatted_end_time || event.formatted_time}
                </span>
            </div>
        )
    } else {
        return (
            <div className={`text-gray-800 font-semibold ${textSize} flex items-center gap-2 ${className}`}>
                <span className="text-sky">📅</span>
                <span>{event.formatted_date} {event.formatted_time}{event.formatted_end_time ? ` - ${event.formatted_end_time}` : ''}</span>
            </div>
        )
    }
}


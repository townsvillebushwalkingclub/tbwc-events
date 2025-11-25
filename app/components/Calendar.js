'use client'

export default function Calendar({
    currentDate,
    events,
    onPreviousMonth,
    onNextMonth,
    onGoToToday,
}) {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)

    // Calculate start date to show Monday as first day of week
    const startDate = new Date(firstDay)
    const dayOfWeek = firstDay.getDay()
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // Monday = 1, Sunday = 0
    startDate.setDate(startDate.getDate() - daysToSubtract)

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const today = new Date()

    const getEventsForDate = (date) => {
        const filteredEvents = events.filter((event) => {
            const eventStart = new Date(event.start_time)
            const eventEnd = event.end_time
                ? new Date(event.end_time)
                : eventStart

            // Normalize dates to start of day for comparison (using UTC to avoid timezone issues)
            const dateStart = new Date(
                Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
            )
            const eventStartDay = new Date(
                Date.UTC(
                    eventStart.getFullYear(),
                    eventStart.getMonth(),
                    eventStart.getDate()
                )
            )
            const eventEndDay = new Date(
                Date.UTC(
                    eventEnd.getFullYear(),
                    eventEnd.getMonth(),
                    eventEnd.getDate()
                )
            )

            // Check if the date falls within the event's date range (inclusive)
            const isInRange =
                dateStart >= eventStartDay && dateStart <= eventEndDay

            return isInRange
        })

        return filteredEvents
    }

    return (
        <div>
            {/* Calendar Header */}
            <div className="bg-linear-to-r from-blue-400 to-cyan-400 text-white p-8">
                <div className="flex justify-between items-center">
                    <div className="flex gap-4 items-center">
                        <button
                            onClick={onPreviousMonth}
                            className="bg-white/20 hover:bg-white/30 transition-all duration-300 px-6 py-3 rounded-full font-semibold"
                        >
                            ← Previous
                        </button>
                        <button
                            onClick={onGoToToday}
                            className="bg-white/20 hover:bg-white/30 transition-all duration-300 px-6 py-3 rounded-full font-semibold"
                        >
                            Today
                        </button>
                        <button
                            onClick={onNextMonth}
                            className="bg-white/20 hover:bg-white/30 transition-all duration-300 px-6 py-3 rounded-full font-semibold"
                        >
                            Next →
                        </button>
                    </div>
                    <div className="text-3xl font-bold">
                        {new Date(year, month).toLocaleDateString('en-AU', {
                            month: 'long',
                            year: 'numeric',
                            timeZone: 'Australia/Brisbane',
                        })}
                    </div>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-px bg-gray-200">
                {/* Day Headers */}
                {days.map((day) => (
                    <div
                        key={day}
                        className="bg-gray-50 p-4 text-center font-semibold text-gray-600"
                    >
                        {day}
                    </div>
                ))}

                {/* Calendar Days */}
                {Array.from({ length: 42 }, (_, i) => {
                    const date = new Date(startDate)
                    date.setDate(startDate.getDate() + i)

                    const isOtherMonth = date.getMonth() !== month
                    const isToday = date.toDateString() === today.toDateString()
                    const dayEvents = getEventsForDate(date)

                    return (
                        <div
                            key={i}
                            className={`min-h-[120px] p-3 relative transition-all duration-300 ${
                                isOtherMonth
                                    ? 'bg-gray-50 text-gray-400'
                                    : 'bg-white hover:bg-gray-50'
                            } ${
                                isToday
                                    ? 'bg-blue-50 border-2 border-blue-500'
                                    : ''
                            }`}
                        >
                            <div className="font-bold text-gray-800 mb-2">
                                {date.getDate()}
                            </div>

                            {/* Event Indicators */}
                            {(() => {
                                // Separate multi-day and single-day events
                                const multiDayEvents = dayEvents.filter(
                                    (event) => {
                                        const eventStart = new Date(
                                            event.start_time
                                        )
                                        const eventEnd = event.end_time
                                            ? new Date(event.end_time)
                                            : eventStart
                                        const eventStartDay = new Date(
                                            Date.UTC(
                                                eventStart.getFullYear(),
                                                eventStart.getMonth(),
                                                eventStart.getDate()
                                            )
                                        )
                                        const eventEndDay = new Date(
                                            Date.UTC(
                                                eventEnd.getFullYear(),
                                                eventEnd.getMonth(),
                                                eventEnd.getDate()
                                            )
                                        )
                                        return (
                                            event.is_multi_day ||
                                            eventStartDay.getTime() !==
                                                eventEndDay.getTime()
                                        )
                                    }
                                )

                                const singleDayEvents = dayEvents.filter(
                                    (event) => {
                                        const eventStart = new Date(
                                            event.start_time
                                        )
                                        const eventEnd = event.end_time
                                            ? new Date(event.end_time)
                                            : eventStart
                                        const eventStartDay = new Date(
                                            Date.UTC(
                                                eventStart.getFullYear(),
                                                eventStart.getMonth(),
                                                eventStart.getDate()
                                            )
                                        )
                                        const eventEndDay = new Date(
                                            Date.UTC(
                                                eventEnd.getFullYear(),
                                                eventEnd.getMonth(),
                                                eventEnd.getDate()
                                            )
                                        )
                                        return !(
                                            event.is_multi_day ||
                                            eventStartDay.getTime() !==
                                                eventEndDay.getTime()
                                        )
                                    }
                                )

                                // Normalize current date for comparison
                                const dateStart = new Date(
                                    Date.UTC(
                                        date.getFullYear(),
                                        date.getMonth(),
                                        date.getDate()
                                    )
                                )

                                return (
                                    <>
                                        {/* Multi-day events - only show on first day */}
                                        {multiDayEvents.map((event, index) => {
                                            const eventStart = new Date(
                                                event.start_time
                                            )
                                            const eventEnd = event.end_time
                                                ? new Date(event.end_time)
                                                : eventStart
                                            const eventStartDay = new Date(
                                                Date.UTC(
                                                    eventStart.getFullYear(),
                                                    eventStart.getMonth(),
                                                    eventStart.getDate()
                                                )
                                            )
                                            const isFirstDay =
                                                dateStart.getTime() ===
                                                eventStartDay.getTime()

                                            if (!isFirstDay) return null

                                            const daysDiff =
                                                Math.ceil(
                                                    (eventEnd.getTime() -
                                                        eventStart.getTime()) /
                                                        (1000 * 60 * 60 * 24)
                                                ) + 1

                                            return (
                                                <div
                                                    key={`multi-${index}`}
                                                    className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-sm mb-1 border-2 border-purple-500 absolute"
                                                    style={{
                                                        left: '0',
                                                        right: `-${
                                                            (daysDiff - 1) * 100
                                                        }%`,
                                                        zIndex: 10 + index,
                                                        width: `${
                                                            daysDiff * 100
                                                        }%`,
                                                        top: `${
                                                            30 + index * 20
                                                        }px`,
                                                    }}
                                                    title={`${
                                                        event.name
                                                    } (${eventStart.toLocaleDateString()} - ${eventEnd.toLocaleDateString()})`}
                                                >
                                                    {event.name.length > 25
                                                        ? event.name.substring(
                                                              0,
                                                              25
                                                          ) + '...'
                                                        : event.name}{' '}
                                                    (Multi-day)
                                                </div>
                                            )
                                        })}

                                        {/* Single-day events */}
                                        {singleDayEvents.map((event, index) => (
                                            <div
                                                key={`single-${index}`}
                                                className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-sm mb-1"
                                                style={{
                                                    marginTop: `${
                                                        index * 16
                                                    }px`,
                                                }}
                                                title={event.name}
                                            >
                                                {event.name.length > 15
                                                    ? event.name.substring(
                                                          0,
                                                          15
                                                      ) + '...'
                                                    : event.name}
                                            </div>
                                        ))}
                                    </>
                                )
                            })()}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

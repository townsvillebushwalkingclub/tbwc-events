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
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const today = new Date()

    const getEventsForDate = (date) => {
        return events.filter((event) => {
            const eventDate = new Date(event.start_time)
            return eventDate.toDateString() === date.toDateString()
        })
    }

    return (
        <div>
            {/* Calendar Header */}
            <div className="bg-gradient-to-r from-blue-400 to-cyan-400 text-white p-8">
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
                        {new Date(year, month).toLocaleDateString('en-US', {
                            month: 'long',
                            year: 'numeric',
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
                            {dayEvents.map((event, index) => (
                                <div
                                    key={index}
                                    className="w-2 h-2 bg-red-500 rounded-full mb-1"
                                    title={event.name}
                                />
                            ))}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

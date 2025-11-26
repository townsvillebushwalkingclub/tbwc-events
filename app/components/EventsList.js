'use client'

import Image from 'next/image'
import Link from 'next/link'

export default function EventsList({
    events,
    currentDate,
    loading,
    error,
    onRefresh,
}) {
    const monthYear = new Date(currentDate).toLocaleDateString('en-AU', {
        month: 'long',
        year: 'numeric',
        timeZone: 'Australia/Brisbane',
    })

    if (loading) {
        return (
            <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading events...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
                    <div className="text-red-500 text-2xl mb-2">⚠️</div>
                    <h3 className="text-red-800 font-semibold mb-2">
                        Error Loading Events
                    </h3>
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                        onClick={onRefresh}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-4 border-b-2 border-gray-100 gap-4">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
                    Events for {monthYear} & Next 2 Months
                </h2>
                <button
                    onClick={onRefresh}
                    className="bg-linear-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 md:px-6 py-2 md:py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 text-sm md:text-base"
                >
                    🔄 Refresh Events
                </button>
            </div>

            {events.length === 0 ? (
                <div className="text-center py-12">
                    <div className="text-gray-400 text-4xl mb-4">📅</div>
                    <p className="text-gray-600 text-lg">
                        No events scheduled for this month
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {events.map((event) => (
                        <div
                            key={event.id}
                            className="bg-gray-50 rounded-2xl p-6 border-l-4 border-blue-500 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                        >
                            <div className="flex flex-col md:flex-row gap-6">
                                {/* Event Thumbnail */}
                                <div className="shrink-0">
                                    <div className="w-full md:w-24 h-48 md:h-24 rounded-lg overflow-hidden bg-gray-200 flex items-center justify-center">
                                        {event.cover && event.cover.source ? (
                                            <Image
                                                src={event.cover.source}
                                                alt={event.name}
                                                width={96}
                                                height={96}
                                                className="w-full h-full object-cover"
                                                unoptimized
                                            />
                                        ) : (
                                            <div className="text-gray-400 text-2xl">
                                                🏔️
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Event Details */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                                        <Link
                                            href={`/events/${event.id}`}
                                            className="text-xl md:text-2xl font-bold text-gray-800 hover:text-blue-600 transition-colors"
                                        >
                                            {event.name}
                                        </Link>
                                        {(() => {
                                            const eventDate = new Date(
                                                event.start_time
                                            )
                                            const currentMonth = new Date(
                                                currentDate
                                            ).getMonth()
                                            const eventMonth =
                                                eventDate.getMonth()
                                            const currentYear = new Date(
                                                currentDate
                                            ).getFullYear()
                                            const eventYear =
                                                eventDate.getFullYear()

                                            // Calculate month difference
                                            const monthDiff =
                                                (eventYear - currentYear) * 12 +
                                                (eventMonth - currentMonth)

                                            if (monthDiff === 1) {
                                                return (
                                                    <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-2 py-1 rounded-full">
                                                        Next Month
                                                    </span>
                                                )
                                            } else if (monthDiff === 2) {
                                                return (
                                                    <span className="bg-orange-100 text-orange-800 text-xs font-semibold px-2 py-1 rounded-full">
                                                        Month After Next
                                                    </span>
                                                )
                                            }
                                            return null
                                        })()}
                                    </div>

                                    <div className="text-blue-600 font-semibold mb-2">
                                        {event.formatted_date}
                                    </div>

                                    <div className="text-gray-600 mb-4">
                                        🕐 {event.formatted_time}
                                        {event.formatted_end_time &&
                                            ` - ${event.formatted_end_time}`}
                                        {event.formatted_end_date && (
                                            <div className="text-blue-600 font-semibold mt-1">
                                                📅 Ends:{' '}
                                                {event.formatted_end_date}
                                            </div>
                                        )}
                                    </div>

                                    {event.description && (
                                        <div className="text-gray-700 mb-4 leading-relaxed whitespace-pre-wrap">
                                            {event.description}
                                        </div>
                                    )}

                                    {event.place && (
                                        <div className="text-gray-600 mb-4 italic">
                                            📍{' '}
                                            {event.place.name || 'Location TBA'}
                                        </div>
                                    )}

                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                        <div className="flex gap-4 sm:gap-6 text-sm text-gray-500">
                                            <span>
                                                👥 {event.attending_count}{' '}
                                                attending
                                            </span>
                                            <span>
                                                ❤️ {event.interested_count}{' '}
                                                interested
                                            </span>
                                        </div>

                                        <a
                                            href={`https://www.facebook.com/events/${event.id}/`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 text-sm md:text-base"
                                        >
                                            📘 View on Facebook
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

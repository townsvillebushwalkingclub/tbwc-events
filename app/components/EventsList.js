'use client'

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
            <div className="flex justify-between items-center mb-8 pb-4 border-b-2 border-gray-100">
                <h2 className="text-3xl font-bold text-gray-800">
                    Events for {monthYear}
                </h2>
                <button
                    onClick={onRefresh}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105"
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
                            <h3 className="text-2xl font-bold text-gray-800 mb-3">
                                {event.name}
                            </h3>

                            <div className="text-blue-600 font-semibold mb-2">
                                {event.formatted_date}
                            </div>

                            <div className="text-gray-600 mb-4">
                                🕐 {event.formatted_time}
                                {event.formatted_end_time &&
                                    ` - ${event.formatted_end_time}`}
                            </div>

                            {event.description && (
                                <div className="text-gray-700 mb-4 leading-relaxed whitespace-pre-wrap">
                                    {event.description}
                                </div>
                            )}

                            {event.place && (
                                <div className="text-gray-600 mb-4 italic">
                                    📍 {event.place.name || 'Location TBA'}
                                </div>
                            )}

                            <div className="flex justify-between items-center">
                                <div className="flex gap-6 text-sm text-gray-500">
                                    <span>
                                        👥 {event.attending_count} attending
                                    </span>
                                    <span>
                                        ❤️ {event.interested_count} interested
                                    </span>
                                </div>

                                <a
                                    href={`https://www.facebook.com/events/${event.id}/`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
                                >
                                    📘 View on Facebook
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

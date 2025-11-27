'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { isAllowedDomain } from '@/lib/allowed-domains'

export default function EventsList({ events, currentDate }) {
    const [expandedDescriptions, setExpandedDescriptions] = useState({})

    const monthYear = new Date(currentDate).toLocaleDateString('en-AU', {
        month: 'long',
        year: 'numeric',
        timeZone: 'Australia/Brisbane',
    })

    // Function to normalize newlines for consistent spacing
    const normalizeNewlines = (text) => {
        if (!text) return ''
        // Normalize multiple consecutive newlines to double newline (paragraph break)
        // This ensures consistent spacing between truncated and full descriptions
        return text.replace(/\n\s*\n+/g, '\n\n').replace(/\r\n/g, '\n')
    }

    // Function to truncate description to first N paragraphs
    // Preserves original newline structure to avoid adding extra spacing
    const truncateDescription = (description, maxParagraphs = 2) => {
        if (!description) return ''

        // Check if text has double newlines (paragraph breaks)
        const hasDoubleNewlines = /\n\s*\n/.test(description)

        if (hasDoubleNewlines) {
            // Split on double newlines (actual paragraph breaks)
            const paragraphs = description.split(/\n\s*\n+/)
            const filteredParagraphs = paragraphs.filter(
                (p) => p.trim().length > 0
            )

            if (filteredParagraphs.length <= maxParagraphs) {
                return description // Return original if short enough
            }

            // Take first maxParagraphs paragraphs
            // Preserve original separator (double newline)
            return filteredParagraphs.slice(0, maxParagraphs).join('\n\n')
        } else {
            // No double newlines - text uses single newlines throughout
            // Take first N*4 lines as approximation (allowing for title + content + bullets)
            const lines = description.split('\n')
            const targetLines = maxParagraphs * 4

            if (lines.length <= targetLines) {
                return description // Return original if short enough
            }

            // Take first targetLines and rejoin with single newline (preserve original structure)
            return lines.slice(0, targetLines).join('\n')
        }
    }

    const toggleDescription = (eventId) => {
        setExpandedDescriptions((prev) => ({
            ...prev,
            [eventId]: !prev[eventId],
        }))
    }

    const isDescriptionLong = (description) => {
        if (!description) return false
        // Normalize newlines for consistent paragraph detection
        const normalized = normalizeNewlines(description)
        // Split ONLY on double newlines (actual paragraph breaks)
        const paragraphs = normalized
            .split(/\n\s*\n+/)
            .filter((p) => p.trim().length > 0)
        return paragraphs.length > 2
    }

    // Process description to add hyperlinks for emails and URLs (same as embed script)
    const processDescription = (description, eventTitle) => {
        if (!description) return ''

        // Normalize newlines first for consistent spacing
        const normalized = normalizeNewlines(description)

        // First, escape any existing HTML to prevent conflicts
        let processed = normalized
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')

        // Convert emails to mailto: links with event title as subject
        processed = processed.replace(
            /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
            function (match) {
                const subject = eventTitle
                    ? encodeURIComponent('Re: ' + eventTitle)
                    : ''
                const mailtoLink = subject
                    ? 'mailto:' + match + '?subject=' + subject
                    : 'mailto:' + match
                return (
                    '<a href="' +
                    mailtoLink +
                    '" class="text-blue-600 hover:text-blue-800 underline break-all">' +
                    match +
                    '</a>'
                )
            }
        )

        // Convert URLs to clickable links (only from allowed domains)
        processed = processed.replace(/(https?:\/\/[^\s]+)/g, function (match) {
            try {
                const url = new URL(match)
                const hostname = url.hostname

                // Check if the hostname is in the allowed domains list
                if (isAllowedDomain(hostname)) {
                    return (
                        '<a href="' +
                        match +
                        '" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline break-all">' +
                        match +
                        '</a>'
                    )
                } else {
                    // Return the URL as plain text if not allowed
                    return match
                }
            } catch (e) {
                // If URL parsing fails, return as plain text
                return match
            }
        })

        // Convert newlines to <br> tags
        // First handle paragraph breaks (double or more newlines) as double <br>
        processed = processed.replace(/\n\s*\n+/g, '<br><br>')
        // Then convert remaining single newlines to single <br>
        // This preserves the original line structure
        processed = processed.replace(/\n/g, '<br>')

        return processed
    }

    return (
        <div>
            <div className="mb-8 pb-4 border-b-2 border-gray-100">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
                    Events for {monthYear} & Next 2 Months
                </h2>
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
                                        <div className="mb-4">
                                            <div
                                                className="text-gray-700 leading-relaxed overflow-hidden transition-all duration-500 ease-in-out"
                                                style={{
                                                    maxHeight:
                                                        expandedDescriptions[
                                                            event.id
                                                        ] ||
                                                        !isDescriptionLong(
                                                            event.description
                                                        )
                                                            ? '2000px' // Large enough for most content
                                                            : '8rem', // ~128px for truncated view
                                                }}
                                                dangerouslySetInnerHTML={{
                                                    __html:
                                                        expandedDescriptions[
                                                            event.id
                                                        ] ||
                                                        !isDescriptionLong(
                                                            event.description
                                                        )
                                                            ? processDescription(
                                                                  event.description,
                                                                  event.name
                                                              )
                                                            : processDescription(
                                                                  truncateDescription(
                                                                      event.description
                                                                  ),
                                                                  event.name
                                                              ),
                                                }}
                                            />
                                            {isDescriptionLong(
                                                event.description
                                            ) && (
                                                <button
                                                    onClick={() =>
                                                        toggleDescription(
                                                            event.id
                                                        )
                                                    }
                                                    className="mt-2 text-blue-600 hover:text-blue-800 font-semibold text-sm transition-colors"
                                                >
                                                    {expandedDescriptions[
                                                        event.id
                                                    ]
                                                        ? 'Read less'
                                                        : 'Read more'}
                                                </button>
                                            )}
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

                                        <div className="flex gap-3">
                                            <Link
                                                href={`/events/${event.id}`}
                                                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 text-sm md:text-base"
                                            >
                                                📄 View Event Page
                                            </Link>
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
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

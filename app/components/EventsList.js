'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import {
    processDescription,
    normalizeNewlines,
} from '@/lib/process-description'
import { getMonthLabel, getFacebookEventUrl } from '@/lib/event-utils'
import { EventDateTime } from './EventDateTime'

export default function EventsList({
    events,
    currentDate,
    titleOverride = null,
}) {
    const [expandedDescriptions, setExpandedDescriptions] = useState({})

    const monthYear = new Date(currentDate).toLocaleDateString('en-AU', {
        month: 'long',
        year: 'numeric',
        timeZone: 'Australia/Brisbane',
    })
    const heading =
        titleOverride != null
            ? titleOverride
            : `Events for ${monthYear} & Next 2 Months`

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

    // Past event that is still in the displayed "current" month → show collapsed, greyed out
    const isPastEventInCurrentMonth = (event) => {
        if (!event?.start_time || !currentDate) return false
        const now = new Date()
        const eventDate = new Date(event.start_time)
        const current = new Date(currentDate)
        if (eventDate >= now) return false
        return (
            eventDate.getFullYear() === current.getFullYear() &&
            eventDate.getMonth() === current.getMonth()
        )
    }

    return (
        <div>
            <div className="mb-8 pb-4 border-b-2 border-gray-100">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
                    {heading}
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
                    {events.map((event) =>
                        isPastEventInCurrentMonth(event) ? (
                            <div
                                key={event.id}
                                className="rounded-2xl p-4 border border-gray-200 bg-gray-100 text-gray-500"
                            >
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                                    <Link
                                        href={`/events/${event.id}`}
                                        className="font-semibold text-gray-600 hover:text-gray-800 transition-colors"
                                    >
                                        {event.name}
                                        {(event.is_cancelled ?? event.is_canceled) && ' (CANCELLED)'}
                                    </Link>
                                    <span className="text-sm text-gray-500">
                                        <EventDateTime
                                            event={event}
                                            textSize="text-sm"
                                            className="!text-gray-500"
                                        />
                                    </span>
                                    <span className="text-sm">(past)</span>
                                    <Link
                                        href={`/events/${event.id}`}
                                        className="text-sm text-casper-orange hover:text-casper-orange-hover font-medium"
                                    >
                                        View event page →
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <div
                                key={event.id}
                                className="bg-white rounded-2xl p-6 border-l-4 border-casper-orange border border-gray-200 hover:shadow-md transition-all duration-200"
                            >
                                <div className="flex flex-col md:flex-row gap-6">
                                    {/* Event Thumbnail */}
                                    <div className="shrink-0">
                                        <div className="relative w-full md:w-24 h-48 md:h-24 rounded-lg overflow-hidden bg-gray-200 flex items-center justify-center">
                                            {event.cover && event.cover.source ? (
                                                <Image
                                                    src={event.cover.source}
                                                    alt={event.name}
                                                    fill
                                                    className="object-cover"
                                                    sizes="(max-width: 768px) 100vw, 96px"
                                                    unoptimized={
                                                        !event.cover.source.startsWith(
                                                            '/event-covers/'
                                                        )
                                                    }
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
                                                className="text-xl md:text-2xl font-bold text-gray-900 hover:text-casper-orange transition-colors"
                                            >
                                                {event.name}
                                                {(event.is_cancelled ?? event.is_canceled) && ' (CANCELLED)'}
                                            </Link>
                                            {(() => {
                                                const monthLabel = getMonthLabel(
                                                    event.start_time,
                                                    currentDate
                                                )

                                                if (monthLabel === 'Next Month') {
                                                    return (
                                                        <span className="bg-sky-light text-gray-800 text-xs font-semibold px-2 py-1 rounded-full border border-sky-muted/50">
                                                            Next Month
                                                        </span>
                                                    )
                                                } else if (
                                                    monthLabel ===
                                                    'Month After Next'
                                                ) {
                                                    return (
                                                        <span className="bg-casper-orange/10 text-gray-800 text-xs font-semibold px-2 py-1 rounded-full border border-casper-orange/30">
                                                            Month After Next
                                                        </span>
                                                    )
                                                }
                                                return null
                                            })()}
                                        </div>

                                        <div className="mb-4">
                                            <EventDateTime event={event} />
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
                                                            (event.is_cancelled ?? event.is_canceled) ||
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
                                                            (event.is_cancelled ?? event.is_canceled) ||
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
                                                ) &&
                                                !(event.is_cancelled ?? event.is_canceled) && (
                                                    <button
                                                        onClick={() =>
                                                            toggleDescription(
                                                                event.id
                                                            )
                                                        }
                                                        className="mt-2 text-casper-orange hover:text-casper-orange-hover font-semibold text-sm transition-colors"
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
                                                    className="bg-casper-orange hover:bg-casper-orange-hover text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 text-sm md:text-base"
                                                >
                                                    📄 View Event Page
                                                </Link>
                                                <a
                                                    href={getFacebookEventUrl(
                                                        event.id
                                                    )}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="border border-gray-300 hover:border-gray-400 bg-white text-gray-800 px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 text-sm md:text-base"
                                                >
                                                    📘 View on Facebook
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    )}
                </div>
            )}
        </div>
    )
}

'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

export default function EventClient({ initialEvent }) {
    const params = useParams()
    const [event, setEvent] = useState(initialEvent)
    const [loading, setLoading] = useState(!initialEvent)
    const [error, setError] = useState(null)

    useEffect(() => {
        // Only fetch if we don't have initial event data
        if (!initialEvent && params.id) {
            const fetchEvent = async () => {
                try {
                    setLoading(true)
                    const response = await fetch(`/api/event/${params.id}`)
                    const data = await response.json()

                    if (data.success) {
                        setEvent(data.data)
                    } else {
                        setError(data.error || 'Event not found')
                    }
                } catch (err) {
                    console.error('Error fetching event:', err)
                    setError('Failed to load event')
                } finally {
                    setLoading(false)
                }
            }

            fetchEvent()
        }
    }, [params.id, initialEvent])

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <div className="text-center text-white">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <p>Loading event...</p>
                </div>
            </div>
        )
    }

    if (error || !event) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <div className="text-center text-white">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h1 className="text-2xl font-bold mb-2">Event Not Found</h1>
                    <p className="mb-6">
                        {error ||
                            'The event you are looking for does not exist.'}
                    </p>
                    <Link
                        href="/"
                        className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-6 py-3 rounded-full font-semibold transition-all duration-300 inline-block"
                    >
                        ← Back to Events
                    </Link>
                </div>
            </div>
        )
    }

    const facebookEventUrl = `https://www.facebook.com/events/${event.id}/`
    const coverImageUrl =
        event.cover && event.cover.source ? event.cover.source : null

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600">
            <div className="container mx-auto px-4 md:px-8 py-8">
                {/* Logo and Back Button */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                    <Link
                        href="/"
                        className="flex items-center gap-3 hover:opacity-90 transition-opacity"
                    >
                        <div className="flex items-center gap-3">
                            <div className="relative w-16 h-16 md:w-20 md:h-20 flex items-center justify-center">
                                <Image
                                    src="/townsville-bushwalking-club-logo.png"
                                    alt="Townsville Bushwalking Club Logo"
                                    width={80}
                                    height={80}
                                    className="object-contain"
                                    priority
                                />
                            </div>
                            <div className="text-white">
                                <div className="text-xl md:text-2xl font-bold">
                                    Townsville Bushwalking Club
                                </div>
                                <div className="text-sm opacity-90">
                                    Events Calendar
                                </div>
                            </div>
                        </div>
                    </Link>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-white hover:opacity-80 transition-opacity bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full"
                    >
                        <span>←</span>
                        <span>Back to Events</span>
                    </Link>
                </div>

                {/* Event Card */}
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                    {/* Cover Image */}
                    {coverImageUrl && (
                        <div className="relative w-full h-64 md:h-96">
                            <Image
                                src={coverImageUrl}
                                alt={event.name}
                                fill
                                className="object-cover"
                                priority
                                unoptimized
                            />
                        </div>
                    )}

                    <div className="p-6 md:p-10">
                        {/* Event Title */}
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
                            {event.name}
                        </h1>

                        {/* Date and Time */}
                        <div className="mb-6">
                            {event.formatted_end_date &&
                            event.formatted_end_date !==
                                event.formatted_date ? (
                                // Multi-day event: show start date/time and end date/time separately
                                <div className="text-blue-600 font-semibold text-lg mb-2 flex items-center gap-2">
                                    <span>📅</span>
                                    <span>
                                        {event.formatted_date}{' '}
                                        {event.formatted_time} to <br />
                                        {event.formatted_end_date}{' '}
                                        {event.formatted_end_time ||
                                            event.formatted_time}
                                    </span>
                                </div>
                            ) : (
                                // Single-day event: show date with time range
                                <div className="text-blue-600 font-semibold text-lg">
                                    📅 {event.formatted_date}{' '}
                                    {event.formatted_time}
                                    {event.formatted_end_time &&
                                        ` - ${event.formatted_end_time}`}
                                </div>
                            )}
                        </div>

                        {/* Location */}
                        {event.place && (
                            <div className="mb-6">
                                <div className="text-gray-700 text-lg">
                                    <span className="font-semibold">
                                        📍 Location:
                                    </span>{' '}
                                    {event.place.name || 'Location TBA'}
                                </div>
                                {event.place.location && (
                                    <div className="text-gray-600 mt-1 ml-6">
                                        {event.place.location.street && (
                                            <div>
                                                {event.place.location.street}
                                            </div>
                                        )}
                                        {event.place.location.city && (
                                            <div>
                                                {event.place.location.city}
                                                {event.place.location.state &&
                                                    `, ${event.place.location.state}`}
                                                {event.place.location.zip &&
                                                    ` ${event.place.location.zip}`}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Description */}
                        {event.description && (
                            <div className="mb-6">
                                <h2 className="text-xl font-bold text-gray-800 mb-3">
                                    About this event
                                </h2>
                                <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                    {event.description}
                                </div>
                            </div>
                        )}

                        {/* Stats */}
                        <div className="flex gap-6 mb-6 text-gray-600">
                            <div>
                                <span className="font-semibold">
                                    👥 Attending:
                                </span>{' '}
                                {event.attending_count}
                            </div>
                            <div>
                                <span className="font-semibold">
                                    ❤️ Interested:
                                </span>{' '}
                                {event.interested_count}
                            </div>
                        </div>

                        {/* Links */}
                        <div className="pt-6 border-t border-gray-200 flex flex-wrap gap-4">
                            <a
                                href={facebookEventUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors inline-flex items-center gap-2"
                            >
                                📘 View on Facebook
                                <span>→</span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

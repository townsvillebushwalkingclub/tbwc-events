'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

// Generate metadata for the event page (runs server-side)
export async function generateMetadata({ params }) {
    try {
        const { id } = await params
        // Import server-side function (generateMetadata runs server-side)
        const { getEventById } = await import('../../../lib/facebook-api.js')
        const event = await getEventById(id)

        if (!event) {
            return {
                title: 'Event Not Found - Townsville Bushwalking Club',
                description: 'The event you are looking for does not exist.',
            }
        }

        const description = event.description
            ? event.description.substring(0, 160).replace(/\n/g, ' ')
            : `Join us for ${event.name} on ${event.formatted_date}. ${event.place ? `Location: ${event.place.name}` : ''}`

        const coverImageUrl =
            event.cover && event.cover.source ? event.cover.source : null

        return {
            title: `${event.name} - Townsville Bushwalking Club`,
            description: description,
            keywords: [
                'Townsville Bushwalking Club',
                'bushwalking',
                'hiking',
                event.name,
                event.place?.name || 'Townsville',
                'North Queensland',
            ],
            openGraph: {
                title: event.name,
                description: description,
                type: 'website',
                url: `https://events.townsvillebushwalkingclub.com/events/${id}`,
                siteName: 'Townsville Bushwalking Club Events',
                locale: 'en_AU',
                images: coverImageUrl
                    ? [
                          {
                              url: coverImageUrl,
                              width: event.cover?.width || 1200,
                              height: event.cover?.height || 630,
                              alt: event.name,
                          },
                      ]
                    : [],
            },
            twitter: {
                card: coverImageUrl ? 'summary_large_image' : 'summary',
                title: event.name,
                description: description,
                images: coverImageUrl ? [coverImageUrl] : [],
            },
            alternates: {
                canonical: `/events/${id}`,
            },
        }
    } catch (error) {
        console.error('Error generating metadata:', error)
        return {
            title: 'Event - Townsville Bushwalking Club',
            description: 'View event details for Townsville Bushwalking Club.',
        }
    }
}

export default function EventPage() {
    const params = useParams()
    const router = useRouter()
    const [event, setEvent] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                setLoading(true)
                const response = await fetch(`/api/events/${params.id}`)
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

        if (params.id) {
            fetchEvent()
        }
    }, [params.id])

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
                    <p className="mb-6">{error || 'The event you are looking for does not exist.'}</p>
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
    const coverImageUrl = event.cover && event.cover.source ? event.cover.source : null

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600">
            <div className="container mx-auto px-4 md:px-8 py-8">
                {/* Back Button */}
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-white mb-6 hover:opacity-80 transition-opacity"
                >
                    <span>←</span>
                    <span>Back to Events</span>
                </Link>

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
                            <div className="text-blue-600 font-semibold text-lg mb-2">
                                📅 {event.formatted_date}
                            </div>
                            <div className="text-gray-700 mb-2">
                                🕐 {event.formatted_time}
                                {event.formatted_end_time &&
                                    ` - ${event.formatted_end_time}`}
                            </div>
                            {event.formatted_end_date &&
                                event.formatted_end_date !== event.formatted_date && (
                                    <div className="text-blue-600 font-semibold text-lg mt-2">
                                        📅 Ends: {event.formatted_end_date}
                                    </div>
                                )}
                        </div>

                        {/* Location */}
                        {event.place && (
                            <div className="mb-6">
                                <div className="text-gray-700 text-lg">
                                    <span className="font-semibold">📍 Location:</span>{' '}
                                    {event.place.name || 'Location TBA'}
                                </div>
                                {event.place.location && (
                                    <div className="text-gray-600 mt-1 ml-6">
                                        {event.place.location.street && (
                                            <div>{event.place.location.street}</div>
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
                                <span className="font-semibold">👥 Attending:</span>{' '}
                                {event.attending_count}
                            </div>
                            <div>
                                <span className="font-semibold">❤️ Interested:</span>{' '}
                                {event.interested_count}
                            </div>
                        </div>

                        {/* Facebook Link */}
                        <div className="pt-6 border-t border-gray-200">
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


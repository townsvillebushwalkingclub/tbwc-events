'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { processDescription } from '@/lib/process-description'
import { getFacebookEventUrl } from '@/lib/event-utils'
import { EventDateTime } from '@/app/components/EventDateTime'
import type { TBWCEvent } from '@/types/event'

interface EventClientProps {
  initialEvent: TBWCEvent | null
}

export default function EventClient({ initialEvent }: EventClientProps) {
  const params = useParams()
  const [event, setEvent] = useState<TBWCEvent | null>(initialEvent)
  const [loading, setLoading] = useState(!initialEvent)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center text-gray-900">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-casper-orange border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading event...</p>
        </div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center text-gray-900">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-2">Event Not Found</h1>
          <p className="mb-6 text-gray-600">
            {error || 'The event you are looking for does not exist.'}
          </p>
          <Link
            href="/"
            className="bg-casper-orange hover:bg-casper-orange-hover text-white px-6 py-3 rounded-lg font-semibold transition-colors inline-block"
          >
            ← Back to Events
          </Link>
        </div>
      </div>
    )
  }

  const facebookEventUrl = getFacebookEventUrl(event.id)
  const coverImageUrl = event.cover?.source ?? null

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 md:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <Link
            href="/"
            className="flex items-center gap-3 text-gray-900 hover:text-casper-orange transition-colors"
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
              <div>
                <div className="text-xl md:text-2xl font-bold">
                  Townsville Bushwalking Club
                </div>
                <div className="text-sm text-gray-600">Events Calendar</div>
              </div>
            </div>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 border border-gray-300 hover:border-gray-400 bg-white text-gray-800 px-5 py-2.5 rounded-lg font-semibold transition-colors"
          >
            <span>←</span>
            <span>Back to Events</span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {event.is_cancelled && (
            <div className="bg-gray-200 text-gray-800 px-6 py-3 text-center font-semibold border-b border-gray-300">
              This event has been cancelled
            </div>
          )}
          {coverImageUrl && (
            <div className="relative w-full h-64 md:h-96">
              <Image
                src={coverImageUrl}
                alt={event.name}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 1280px, 1280px"
                quality={90}
                unoptimized={!coverImageUrl.startsWith('/event-covers/')}
              />
            </div>
          )}

          <div className="p-6 md:p-10">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
              {event.name}
              {event.is_cancelled && (
                <span className="text-gray-600"> (CANCELLED)</span>
              )}
            </h1>

            <div className="mb-6">
              <EventDateTime event={event} textSize="text-lg" />
            </div>

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

            {event.description && (
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-3">
                  About this event
                </h2>
                <div
                  className="text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: processDescription(
                      event.description,
                      event.name,
                      event.start_time
                    ),
                  }}
                />
              </div>
            )}

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

            <div className="pt-6 border-t border-gray-200 flex flex-wrap gap-4">
              <a
                href={facebookEventUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-casper-orange hover:bg-casper-orange-hover text-white px-6 py-3 rounded-lg font-semibold transition-colors inline-flex items-center gap-2"
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

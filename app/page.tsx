import { Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { getPreferredCalendarMonth } from '@/lib/event-utils'
import { buildEventsJsonLd } from '@/lib/event-json-ld'
import { getEventsForCalendarMonths } from '@/lib/facebook-api'
import Calendar from './components/Calendar'
import EventSearch from './components/EventSearch'
import JsonLd from './components/JsonLd'
import type { TBWCEvent } from '@/types/event'
import type { Metadata } from 'next'

const CANONICAL_URL = 'https://events.townsvillebushwalkingclub.com/'

export const metadata: Metadata = {
  title: 'Upcoming events | Townsville Bushwalking Club',
  description:
    'Browse upcoming Townsville Bushwalking Club events, including bushwalks, hikes, social meetups, and outdoor adventures across Townsville and North Queensland.',
  alternates: {
    canonical: CANONICAL_URL,
  },
  openGraph: {
    title: 'Upcoming events | Townsville Bushwalking Club',
    description:
      'Browse upcoming Townsville Bushwalking Club events, including bushwalks, hikes, social meetups, and outdoor adventures across Townsville and North Queensland.',
    url: CANONICAL_URL,
    siteName: 'Townsville Bushwalking Club Events',
    locale: 'en_AU',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Upcoming events | Townsville Bushwalking Club',
    description:
      'Browse upcoming Townsville Bushwalking Club events, including bushwalks, hikes, social meetups, and outdoor adventures across Townsville and North Queensland.',
  },
}

// Static generation: no searchParams so the page can be prerendered.
// Calendar month switching is handled client-side (and fetches from API when needed).
export const revalidate = 21600 // 6 hours

export default async function Home() {
  const now = new Date()
  const minYear = 2022
  const maxFutureDate = new Date(now.getFullYear(), now.getMonth() + 3, 1)

  const year = now.getFullYear()
  const month = now.getMonth() + 1

  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  const monthAfterNext = nextMonth === 12 ? 1 : nextMonth + 1
  const yearAfterNext = nextMonth === 12 ? nextYear + 1 : nextYear

  const monthsToFetch = [
    { year, month },
    { year: nextYear, month: nextMonth },
    { year: yearAfterNext, month: monthAfterNext },
  ]

  let allEvents: TBWCEvent[] = []
  try {
    allEvents = await getEventsForCalendarMonths(monthsToFetch)
  } catch (error) {
    console.error('Error fetching events for calendar:', error)
  }

  allEvents.sort(
    (a, b) =>
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  )

  const preferred = getPreferredCalendarMonth(allEvents, now)
  const currentDate = new Date(preferred.year, preferred.month - 1, 1)

  return (
    <div className="min-h-screen bg-white">
      {allEvents.length > 0 && <JsonLd data={buildEventsJsonLd(allEvents)} />}
      <div className="container mx-auto px-4 md:px-8 py-4 md:py-8">
        <div className="text-center mb-10">
          <div className="flex flex-col items-center justify-center mb-6">
            <div className="relative w-20 h-20 md:w-24 md:h-24 flex items-center justify-center mb-4">
              <Image
                src="/townsville-bushwalking-club-logo.png"
                alt="Townsville Bushwalking Club Logo"
                width={96}
                height={96}
                className="object-contain"
                priority
              />
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4 text-[rgb(var(--foreground-rgb))]">
              Townsville Bushwalking Club
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-6">
              Events Calendar & Activities
            </p>
          </div>
          <div className="flex flex-col sm:flex-row justify-center gap-3 mb-1 flex-wrap">
            <a
              href="https://townsvillebushwalkingclub.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-casper-orange hover:bg-casper-orange-hover text-white px-6 py-3 rounded-full font-semibold transition-colors shadow-sm"
            >
              🌐 Visit Official Website
            </a>
            <a
              href="https://www.facebook.com/townsvillebushwalkingclub/"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-gray-300 hover:border-gray-400 text-gray-800 px-6 py-3 rounded-full font-semibold transition-colors bg-white"
            >
              📘 Facebook Page
            </a>
            <a
              href="https://www.facebook.com/groups/townsvillebushwalking"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-gray-300 hover:border-gray-400 text-gray-800 px-6 py-3 rounded-full font-semibold transition-colors bg-white"
            >
              👥 Facebook Group
            </a>
            <a
              href="https://instagram.com/townsvillebushwalkingclub/"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-gray-300 hover:border-gray-400 text-gray-800 px-6 py-3 rounded-full font-semibold transition-colors bg-white"
            >
              📘 Instagram Profile
            </a>
          </div>
        </div>

        <section
          className="mb-8 text-center md:text-left max-w-3xl mx-auto"
          aria-labelledby="events-intro-heading"
        >
          <h2
            id="events-intro-heading"
            className="text-xl md:text-2xl font-semibold text-[rgb(var(--foreground-rgb))] mb-3"
          >
            Upcoming Townsville Bushwalking Club events
          </h2>
          <p className="text-gray-600 leading-relaxed">
            Browse all upcoming Townsville Bushwalking Club events in one place.
            This page lists upcoming bushwalks, hikes, social catch-ups, and
            outdoor activities in Townsville and across North Queensland, making
            it easy for members and visitors to see what is coming up next.
          </p>
        </section>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-8 shadow-sm">
          <Suspense
            fallback={
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-2 border-casper-orange border-t-transparent mx-auto mb-4"></div>
                <p className="text-gray-600">Loading calendar...</p>
              </div>
            }
          >
            <Calendar
              currentDate={currentDate}
              events={allEvents}
              year={preferred.year}
              month={preferred.month}
              prefetchAnchorYear={year}
              prefetchAnchorMonth={month}
              referenceTime={now.toISOString()}
            />
          </Suspense>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-8 shadow-sm">
          <EventSearch
            initialEvents={allEvents}
            currentDate={currentDate}
            initialSearchQuery={null}
            referenceTime={now.toISOString()}
          />
        </div>

        <p className="mt-12 pt-6 text-center flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <Link
            href="/events/all"
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            All Events
          </Link>
          <Link
            href="/events/search"
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Search
          </Link>
        </p>
      </div>
    </div>
  )
}

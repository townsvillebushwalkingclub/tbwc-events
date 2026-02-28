import { Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { getEventsForCalendarMonths } from '@/lib/facebook-api'
import Calendar from './components/Calendar'
import EventSearch from './components/EventSearch'
import SearchBar from './components/SearchBar'
import type { TBWCEvent } from '@/types/event'

export const revalidate = 21600 // 6 hours

interface HomeProps {
  searchParams: Promise<{ year?: string; month?: string; search?: string }>
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams
  const now = new Date()

  let yearParam = params?.year ? parseInt(params.year, 10) : null
  let monthParam = params?.month ? parseInt(params.month, 10) : null

  if (
    yearParam &&
    (isNaN(yearParam) || yearParam < 2000 || yearParam > 2100)
  ) {
    yearParam = null
  }
  if (
    monthParam &&
    (isNaN(monthParam) || monthParam < 1 || monthParam > 12)
  ) {
    monthParam = null
  }

  const minYear = 2022
  const maxFutureDate = new Date(now.getFullYear(), now.getMonth() + 3, 1)

  let year =
    yearParam && yearParam >= minYear ? yearParam : now.getFullYear()
  let month = monthParam
    ? Math.max(1, Math.min(12, monthParam))
    : now.getMonth() + 1

  const requestedDate = new Date(year, month - 1, 1)
  if (year < minYear || requestedDate >= maxFutureDate) {
    year = now.getFullYear()
    month = now.getMonth() + 1
  }

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

  const currentDate = new Date(year, month - 1, 1)

  return (
    <div className="min-h-screen bg-white">
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
          <Suspense fallback={null}>
            <SearchBar />
          </Suspense>
        </div>

        {!params?.search && (
          <>
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
                  year={year}
                  month={month}
                  serverTodayDateString={now.toDateString()}
                />
              </Suspense>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-8 shadow-sm">
              <EventSearch
                initialEvents={allEvents}
                currentDate={currentDate}
                initialSearchQuery={null}
              />
            </div>
          </>
        )}

        {params?.search && (
          <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-8 shadow-sm">
            <EventSearch
              initialEvents={allEvents}
              currentDate={currentDate}
              initialSearchQuery={params.search}
            />
          </div>
        )}

        <p className="mt-12 pt-6 text-center">
          <Link
            href="/events/all"
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            All events →
          </Link>
        </p>
      </div>
    </div>
  )
}

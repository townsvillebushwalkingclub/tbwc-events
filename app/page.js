import { Suspense } from 'react'
import Image from 'next/image'
import { getEventsForMonth } from '@/lib/facebook-api.js'
import Calendar from './components/Calendar'
import EventSearch from './components/EventSearch'
import SearchBar from './components/SearchBar'

// Revalidate the homepage daily
export const revalidate = 86400 // 1 day

export default async function Home({ searchParams }) {
    // Await searchParams as it's a Promise in Next.js 15+
    const params = await searchParams

    // Get the month from search params, default to current month
    const now = new Date()

    // Security: Validate and sanitize input parameters
    let yearParam = params?.year ? parseInt(params.year) : null
    let monthParam = params?.month ? parseInt(params.month) : null

    // Validate year is a reasonable number (2000-2100)
    if (
        yearParam &&
        (isNaN(yearParam) || yearParam < 2000 || yearParam > 2100)
    ) {
        yearParam = null
    }

    // Validate month is 1-12
    if (
        monthParam &&
        (isNaN(monthParam) || monthParam < 1 || monthParam > 12)
    ) {
        monthParam = null
    }

    // Security: Apply date range restrictions (same as API)
    const minYear = 2022
    const maxFutureDate = new Date(now.getFullYear(), now.getMonth() + 6, 1)

    let year = yearParam && yearParam >= minYear ? yearParam : now.getFullYear()
    let month = monthParam
        ? Math.max(1, Math.min(12, monthParam))
        : now.getMonth() + 1

    // Check if requested date is outside allowed range
    const requestedDate = new Date(year, month - 1, 1)
    if (year < minYear || requestedDate >= maxFutureDate) {
        // Reset to current month if outside range
        year = now.getFullYear()
        month = now.getMonth() + 1
    }

    // Calculate next month
    const nextMonth = month === 12 ? 1 : month + 1
    const nextYear = month === 12 ? year + 1 : year

    // Calculate month after next
    const monthAfterNext = nextMonth === 12 ? 1 : nextMonth + 1
    const yearAfterNext = nextMonth === 12 ? nextYear + 1 : nextYear

    // Fetch events for current month and next 2 months only (exclude previous month)
    const monthsToFetch = [
        { year, month },
        { year: nextYear, month: nextMonth },
        { year: yearAfterNext, month: monthAfterNext },
    ]

    let allEvents = []
    const fetchPromises = monthsToFetch.map(
        async ({ year: fetchYear, month: fetchMonth }) => {
            try {
                const events = await getEventsForMonth(fetchYear, fetchMonth)
                return events || []
            } catch (error) {
                console.error(
                    `Error fetching events for ${fetchYear}/${fetchMonth}:`,
                    error
                )
                return []
            }
        }
    )

    const results = await Promise.all(fetchPromises)
    allEvents = results.flat()

    // Sort events by start time
    allEvents.sort((a, b) => new Date(a.start_time) - new Date(b.start_time))

    // Create currentDate object for components
    const currentDate = new Date(year, month - 1, 1)

    return (
        <div className="min-h-screen bg-linear-to-br from-blue-500 to-purple-600">
            <div className="container mx-auto px-4 md:px-8 py-4 md:py-8">
                {/* Header */}
                <div className="text-center mb-10 text-white">
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
                        <h1 className="text-3xl md:text-5xl font-bold mb-4 drop-shadow-lg">
                            Townsville Bushwalking Club
                        </h1>
                        <p className="text-lg md:text-xl opacity-90 mb-6">
                            Events Calendar & Activities
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-center gap-4 mb-1">
                        <a
                            href="https://townsvillebushwalkingclub.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-800 px-6 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
                        >
                            🌐 Visit Official Website
                        </a>
                        <a
                            href="https://www.facebook.com/townsvillebushwalkingclub/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-800 px-6 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
                        >
                            📘 Facebook Page
                        </a>
                        <a
                            href="https://www.facebook.com/groups/townsvillebushwalking"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-800 px-6 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
                        >
                            👥 Facebook Group
                        </a>
                        <a
                            href="https://instagram.com/townsvillebushwalkingclub/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-800 px-6 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
                        >
                            📘 Instagram Profile
                        </a>
                    </div>
                    <Suspense fallback={null}>
                        <SearchBar />
                    </Suspense>
                </div>

                {/* Calendar – hidden when search is active */}
                {!params?.search && (
                    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden mb-8">
                        <Suspense
                            fallback={
                                <div className="p-8 text-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                                    <p className="text-gray-600">
                                        Loading calendar...
                                    </p>
                                </div>
                            }
                        >
                            <Calendar
                                currentDate={currentDate}
                                events={allEvents}
                                year={year}
                                month={month}
                            />
                        </Suspense>
                    </div>
                )}

                {/* Events List or Search Results */}
                <div className="bg-white rounded-3xl shadow-2xl p-4 md:p-8">
                    <EventSearch
                        initialEvents={allEvents}
                        currentDate={currentDate}
                        initialSearchQuery={params?.search}
                    />
                </div>
            </div>
        </div>
    )
}

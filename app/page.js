import { Suspense } from 'react'
import { getEventsForMonth } from '@/lib/facebook-api.js'
import Calendar from './components/Calendar'
import EventsList from './components/EventsList'

// Revalidate the homepage daily
export const revalidate = 86400 // 1 day

export default async function Home({ searchParams }) {
    // Await searchParams as it's a Promise in Next.js 15+
    const params = await searchParams
    
    // Get the month from search params, default to current month
    const now = new Date()
    const yearParam = params?.year
        ? parseInt(params.year)
        : now.getFullYear()
    const monthParam = params?.month
        ? parseInt(params.month)
        : now.getMonth() + 1

    // Validate and clamp the month/year
    const year = yearParam || now.getFullYear()
    const month = Math.max(1, Math.min(12, monthParam || now.getMonth() + 1))

    // Calculate previous month
    const prevMonth = month === 1 ? 12 : month - 1
    const prevYear = month === 1 ? year - 1 : year

    // Calculate next month
    const nextMonth = month === 12 ? 1 : month + 1
    const nextYear = month === 12 ? year + 1 : year

    // Calculate month after next
    const monthAfterNext = nextMonth === 12 ? 1 : nextMonth + 1
    const yearAfterNext = nextMonth === 12 ? nextYear + 1 : nextYear

    // Fetch events for all months in parallel
    const monthsToFetch = [
        { year: prevYear, month: prevMonth },
        { year, month },
        { year: nextYear, month: nextMonth },
        { year: yearAfterNext, month: monthAfterNext },
    ]

    let allEvents = []
    const fetchPromises = monthsToFetch.map(async ({ year: fetchYear, month: fetchMonth }) => {
        try {
            const events = await getEventsForMonth(fetchYear, fetchMonth)
            return events || []
        } catch (error) {
            console.error(`Error fetching events for ${fetchYear}/${fetchMonth}:`, error)
            return []
        }
    })

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
                    <h1 className="text-3xl md:text-5xl font-bold mb-4 drop-shadow-lg">
                        🏔️ Townsville Bushwalking Club
                    </h1>
                    <p className="text-lg md:text-xl opacity-90 mb-6">
                        Events Calendar & Activities
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
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
                            href="https://instagram.com/townsvillebushwalkingclub/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-800 px-6 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
                        >
                            📘 Instagram Profile
                        </a>
                    </div>
                </div>

                {/* Calendar */}
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden mb-8">
                    <Suspense fallback={
                        <div className="p-8 text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading calendar...</p>
                        </div>
                    }>
                        <Calendar
                            currentDate={currentDate}
                            events={allEvents}
                            year={year}
                            month={month}
                        />
                    </Suspense>
                </div>

                {/* Events List */}
                <div className="bg-white rounded-3xl shadow-2xl p-4 md:p-8">
                    <EventsList events={allEvents} currentDate={currentDate} />
                </div>
            </div>
        </div>
    )
}

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Calendar from './components/Calendar'
import EventsList from './components/EventsList'

export default function Home() {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [events, setEvents] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const cancelledRef = useRef(false)

    const loadEvents = useCallback(async () => {
        try {
            setLoading(true)
            setEvents([]) // Clear existing events
            setError(null)
            cancelledRef.current = false

            const year = currentDate.getFullYear()
            const month = currentDate.getMonth() + 1

            // Calculate previous month
            const prevMonth = month === 1 ? 12 : month - 1
            const prevYear = month === 1 ? year - 1 : year

            // Calculate next month
            const nextMonth = month === 12 ? 1 : month + 1
            const nextYear = month === 12 ? year + 1 : year

            // Calculate month after next
            const monthAfterNext = nextMonth === 12 ? 1 : nextMonth + 1
            const yearAfterNext = nextMonth === 12 ? nextYear + 1 : nextYear

            // List of months to fetch
            const monthsToFetch = [
                { year: prevYear, month: prevMonth },
                { year, month },
                { year: nextYear, month: nextMonth },
                { year: yearAfterNext, month: monthAfterNext },
            ]

            // Track all events as they come in
            let allEvents = []
            let hasReceivedEvents = false

            // Fetch events progressively, one month at a time
            for (const {
                year: fetchYear,
                month: fetchMonth,
            } of monthsToFetch) {
                if (cancelledRef.current) return

                try {
                    const response = await fetch(
                        `/api/events/${fetchYear}/${fetchMonth}`
                    )
                    const data = await response.json()

                    if (cancelledRef.current) return

                    if (data.success && data.data && data.data.length > 0) {
                        hasReceivedEvents = true

                        // Add new events to our collection
                        allEvents = allEvents.concat(data.data)

                        // Sort events by start time
                        allEvents.sort(
                            (a, b) =>
                                new Date(a.start_time) - new Date(b.start_time)
                        )

                        // Update state immediately with current events
                        setEvents([...allEvents])
                    }
                } catch (fetchError) {
                    console.error(
                        `Error fetching events for ${fetchYear}/${fetchMonth}:`,
                        fetchError
                    )
                    // Continue fetching other months even if one fails
                }
            }

            if (cancelledRef.current) return

            // If we received events, we're done loading
            setLoading(false)
        } catch (error) {
            if (cancelledRef.current) return
            console.error('Error loading events:', error)
            setError(error.message)
            setLoading(false)
        }
    }, [currentDate])

    useEffect(() => {
        cancelledRef.current = false

        const fetchData = async () => {
            try {
                setLoading(true)
                setEvents([]) // Clear existing events
                setError(null)

                const year = currentDate.getFullYear()
                const month = currentDate.getMonth() + 1

                // Calculate previous month
                const prevMonth = month === 1 ? 12 : month - 1
                const prevYear = month === 1 ? year - 1 : year

                // Calculate next month
                const nextMonth = month === 12 ? 1 : month + 1
                const nextYear = month === 12 ? year + 1 : year

                // Calculate month after next
                const monthAfterNext = nextMonth === 12 ? 1 : nextMonth + 1
                const yearAfterNext = nextMonth === 12 ? nextYear + 1 : nextYear

                // List of months to fetch
                const monthsToFetch = [
                    { year: prevYear, month: prevMonth },
                    { year, month },
                    { year: nextYear, month: nextMonth },
                    { year: yearAfterNext, month: monthAfterNext },
                ]

                // Track all events as they come in
                let allEvents = []
                let hasReceivedEvents = false

                // Fetch events progressively, one month at a time
                for (const {
                    year: fetchYear,
                    month: fetchMonth,
                } of monthsToFetch) {
                    if (cancelledRef.current) return

                    try {
                        const response = await fetch(
                            `/api/events/${fetchYear}/${fetchMonth}`
                        )
                        const data = await response.json()

                        if (cancelledRef.current) return

                        if (data.success && data.data && data.data.length > 0) {
                            hasReceivedEvents = true

                            // Add new events to our collection
                            allEvents = allEvents.concat(data.data)

                            // Sort events by start time
                            allEvents.sort(
                                (a, b) =>
                                    new Date(a.start_time) -
                                    new Date(b.start_time)
                            )

                            // Update state immediately with current events
                            setEvents([...allEvents])
                        }
                    } catch (fetchError) {
                        console.error(
                            `Error fetching events for ${fetchYear}/${fetchMonth}:`,
                            fetchError
                        )
                        // Continue fetching other months even if one fails
                    }
                }

                if (cancelledRef.current) return

                // If we received events, we're done loading
                setLoading(false)
            } catch (error) {
                if (cancelledRef.current) return
                console.error('Error loading events:', error)
                setError(error.message)
                setLoading(false)
            }
        }

        fetchData()

        return () => {
            cancelledRef.current = true
        }
    }, [currentDate])

    const previousMonth = () => {
        setCurrentDate((prev) => {
            const newDate = new Date(prev)
            newDate.setMonth(prev.getMonth() - 1)
            return newDate
        })
    }

    const nextMonth = () => {
        setCurrentDate((prev) => {
            const newDate = new Date(prev)
            newDate.setMonth(prev.getMonth() + 1)
            return newDate
        })
    }

    const goToToday = () => {
        setCurrentDate(new Date())
    }

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
                            className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-6 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 backdrop-blur-xs"
                        >
                            🌐 Visit Official Website
                        </a>
                        <a
                            href="https://www.facebook.com/townsvillebushwalkingclub/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-6 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 backdrop-blur-xs"
                        >
                            📘 Facebook Page
                        </a>
                        <a
                            href="https://instagram.com/townsvillebushwalkingclub/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-6 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 backdrop-blur-xs"
                        >
                            📘 Instagram Profile
                        </a>
                    </div>
                </div>

                {/* Calendar */}
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden mb-8">
                    <Calendar
                        currentDate={currentDate}
                        events={events}
                        onPreviousMonth={previousMonth}
                        onNextMonth={nextMonth}
                        onGoToToday={goToToday}
                    />
                </div>

                {/* Events List */}
                <div className="bg-white rounded-3xl shadow-2xl p-4 md:p-8">
                    <EventsList
                        events={events}
                        currentDate={currentDate}
                        loading={loading}
                        error={error}
                        onRefresh={loadEvents}
                    />
                </div>
            </div>
        </div>
    )
}

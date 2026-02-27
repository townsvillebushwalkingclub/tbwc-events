import Link from 'next/link'
import Image from 'next/image'
import { getAllEvents } from '@/lib/facebook-api.js'

const MIN_YEAR = 2020
const BRISBANE_TIMEZONE = 'Australia/Brisbane'

function formatListDate(dateString) {
    const d = new Date(dateString)
    return d.toLocaleDateString('en-AU', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: BRISBANE_TIMEZONE,
    })
}

export const revalidate = 21600 // 6 hours

export const metadata = {
    title: 'All events – Townsville Bushwalking Club',
    description:
        'List of past and upcoming events hosted by the Townsville Bushwalking Club (incomplete).',
}

export default async function AllEventsPage() {
    let events = []
    try {
        events = await getAllEvents()
    } catch (e) {
        console.error('All events page: failed to load events', e)
    }

    const from2020 = events.filter((event) => {
        if (!event.start_time) return false
        const year = new Date(event.start_time).getFullYear()
        return year >= MIN_YEAR
    })

    from2020.sort((a, b) => new Date(b.start_time) - new Date(a.start_time))

    return (
        <div className="min-h-screen bg-white">
            <div className="container mx-auto px-4 md:px-8 py-4 md:py-8 max-w-4xl">
                <div className="flex flex-col items-center mb-8">
                    <div className="relative w-16 h-16 flex items-center justify-center mb-3">
                        <Image
                            src="/townsville-bushwalking-club-logo.png"
                            alt=""
                            width={64}
                            height={64}
                            className="object-contain"
                        />
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-[rgb(var(--foreground-rgb))]">
                        All events
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Townsville Bushwalking Club
                    </p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-8 text-amber-900 text-sm">
                    <strong>Note:</strong> This list is incomplete. It includes
                    events we have on record from 2020 onward; earlier or
                    unlisted events are not shown.
                </div>

                <nav aria-label="Event list">
                    <ul className="list-none p-0 m-0 space-y-0 border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        {from2020.length === 0 ? (
                            <li className="px-4 py-6 text-center text-gray-500 bg-white">
                                No events found for {MIN_YEAR} onward.
                            </li>
                        ) : (
                            from2020.map((event, index) => (
                                <li
                                    key={event.id}
                                    className={
                                        index > 0
                                            ? 'border-t border-gray-100'
                                            : ''
                                    }
                                >
                                    <Link
                                        href={`/events/${event.id}`}
                                        className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-3 bg-white hover:bg-gray-50 transition-colors text-left"
                                    >
                                        <span
                                            className="text-gray-500 text-sm shrink-0"
                                            style={{ minWidth: '7.5rem' }}
                                        >
                                            {formatListDate(event.start_time)}
                                        </span>
                                        <span className="font-medium text-[rgb(var(--foreground-rgb))]">
                                            {event.name}
                                        </span>
                                    </Link>
                                </li>
                            ))
                        )}
                    </ul>
                </nav>

                <p className="mt-6 text-center">
                    <Link
                        href="/"
                        className="text-casper-orange hover:underline font-medium"
                    >
                        ← Back to calendar
                    </Link>
                </p>
            </div>
        </div>
    )
}

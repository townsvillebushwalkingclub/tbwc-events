'use client'

import { useState } from 'react'
import {
  CALENDAR_FEED_URL,
  CALENDAR_FEED_WEBCAL_URL,
} from '@/lib/site'

export default function CalendarSubscribe() {
  const [copied, setCopied] = useState(false)

  async function copyFeedUrl() {
    try {
      await navigator.clipboard.writeText(CALENDAR_FEED_URL)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <section
      className="mt-8 mb-8 bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm"
      aria-labelledby="calendar-subscribe-heading"
    >
      <h2
        id="calendar-subscribe-heading"
        className="text-xl md:text-2xl font-semibold text-[rgb(var(--foreground-rgb))] mb-2"
      >
        Subscribe to calendar
      </h2>
      <p className="text-gray-600 leading-relaxed mb-5">
        Subscribe once — your calendar app will stay updated with new walks,
        changes, and cancellations.
      </p>

      <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-4">
        <a
          href={CALENDAR_FEED_WEBCAL_URL}
          className="inline-flex items-center justify-center gap-2 bg-casper-orange hover:bg-casper-orange-hover text-white px-5 py-2.5 rounded-lg font-semibold transition-colors"
        >
          Subscribe in calendar app
        </a>
        <button
          type="button"
          onClick={copyFeedUrl}
          className="inline-flex items-center justify-center gap-2 border border-gray-300 hover:border-gray-400 bg-white text-gray-800 px-5 py-2.5 rounded-lg font-semibold transition-colors"
        >
          {copied ? 'Link copied' : 'Copy feed link'}
        </button>
        <a
          href="/api/calendar/feed"
          download="tbwc-events.ics"
          className="inline-flex items-center justify-center gap-2 border border-gray-300 hover:border-gray-400 bg-white text-gray-800 px-5 py-2.5 rounded-lg font-semibold transition-colors"
        >
          Download all upcoming
        </a>
      </div>

      <p className="text-sm text-gray-500 break-all">
        Feed URL:{' '}
        <a
          href={CALENDAR_FEED_URL}
          className="text-casper-orange hover:underline"
        >
          {CALENDAR_FEED_URL}
        </a>
      </p>
    </section>
  )
}

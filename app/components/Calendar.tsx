'use client'

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  getMonthCalendarGrid,
  getMonthsInGrid,
  getMultiDayEventSegment,
  getPrefetchMonths,
  monthKey,
  monthsToFetchForGrid,
} from '@/lib/calendar-grid'
import {
  buildCalendarEventLabel,
  getCalendarDateInTimeZone,
  getPreferredCalendarMonth,
  isEventPastOnCalendar,
  isMultiDayEvent,
  formatCalendarMonthLabel,
} from '@/lib/event-utils'
import type { TBWCEvent } from '@/types/event'

const MULTI_DAY_ROW_HEIGHT = 22
const MOBILE_MIN_NAME_CHARS = 8
const MOBILE_MAX_NAME_CHARS = 20
const MOBILE_MAX_NAME_CHARS_WIDE = 28

const CALENDAR_EVENT_TEXT_CLASS = 'truncate whitespace-nowrap'

const CALENDAR_EVENT_PADDING_CLASS = 'px-1.5 py-1 lg:px-2'

function getMobileNameLimits(segmentDays = 1) {
  return {
    minNameLength: MOBILE_MIN_NAME_CHARS,
    maxNameLength:
      segmentDays > 1 ? MOBILE_MAX_NAME_CHARS_WIDE : MOBILE_MAX_NAME_CHARS,
  }
}

interface CalendarProps {
  currentDate: Date
  events: TBWCEvent[]
  /** Default month when URL has no year/month (may be “smart” ahead of anchor). */
  year: number
  month: number
  /** First month of the 3-month server prefetch; drives in-memory vs API event source. */
  prefetchAnchorYear: number
  prefetchAnchorMonth: number
  /** ISO timestamp from the server render; keeps past/upcoming styling in sync during hydration. */
  referenceTime: string
}

// Server prefetches 3 consecutive months from prefetchAnchor (see page.tsx monthsToFetch).
function isInPrefetchRange(
  viewYear: number,
  viewMonth: number,
  anchorYear: number,
  anchorMonth: number
): boolean {
  const a = anchorYear * 12 + anchorMonth
  const b = viewYear * 12 + viewMonth
  return b >= a && b < a + 3
}

export default function Calendar({
  currentDate,
  events: serverEvents,
  year: initialYear,
  month: initialMonth,
  prefetchAnchorYear,
  prefetchAnchorMonth,
  referenceTime,
}: CalendarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const viewFromUrl = ((): { y: number; m: number } => {
    const y = searchParams.get('year')
    const m = searchParams.get('month')
    if (y && m) {
      const yi = parseInt(y, 10)
      const mi = parseInt(m, 10)
      if (
        !isNaN(yi) &&
        !isNaN(mi) &&
        mi >= 1 &&
        mi <= 12 &&
        yi >= 2022 &&
        yi <= 2100
      )
        return { y: yi, m: mi }
    }
    return { y: initialYear, m: initialMonth }
  })()

  const [viewYear, setViewYear] = useState(viewFromUrl.y)
  const [viewMonth, setViewMonth] = useState(viewFromUrl.m)
  const [overflowEvents, setOverflowEvents] = useState<TBWCEvent[] | null>(null)
  const [overflowKey, setOverflowKey] = useState<string | null>(null)
  const [adjacentEvents, setAdjacentEvents] = useState<TBWCEvent[]>([])
  const [adjacentKey, setAdjacentKey] = useState<string | null>(null)
  const [todayDateString, setTodayDateString] = useState<string | null>(null)
  const [pastCheckTime, setPastCheckTime] = useState(
    () => new Date(referenceTime)
  )
  const [isMobileCalendar, setIsMobileCalendar] = useState(false)
  const prevTodayRef = useRef<string | null>(null)

  const inPrefetchRange = isInPrefetchRange(
    viewYear,
    viewMonth,
    prefetchAnchorYear,
    prefetchAnchorMonth
  )
  const baseEvents = inPrefetchRange ? serverEvents : overflowEvents ?? []

  const navigateToMonth = useCallback(
    (newYear: number, newMonth: number) => {
      if (
        isInPrefetchRange(newYear, newMonth, prefetchAnchorYear, prefetchAnchorMonth)
      ) {
        setOverflowEvents(null)
        setOverflowKey(null)
      }
      setAdjacentEvents([])
      setAdjacentKey(null)
      setViewYear(newYear)
      setViewMonth(newMonth)
      const params = new URLSearchParams()
      params.set('year', newYear.toString())
      params.set('month', newMonth.toString())
      router.replace(`/?${params.toString()}`, { scroll: false })
    },
    [router, prefetchAnchorYear, prefetchAnchorMonth]
  )

  const overflowKeyForView = `${viewYear}-${viewMonth}`
  const loading =
    !inPrefetchRange && overflowKey !== overflowKeyForView

  const displayYear = viewYear
  const displayMonth = viewMonth - 1
  const { startDate, numCells } = useMemo(
    () => getMonthCalendarGrid(viewYear, viewMonth),
    [viewYear, viewMonth]
  )
  const gridMonths = useMemo(
    () => getMonthsInGrid(startDate, numCells),
    [startDate, numCells]
  )
  const prefetchedMonths = useMemo(
    () => getPrefetchMonths(prefetchAnchorYear, prefetchAnchorMonth),
    [prefetchAnchorYear, prefetchAnchorMonth]
  )
  const adjacentMonthsToFetch = useMemo(
    () =>
      monthsToFetchForGrid(
        gridMonths,
        inPrefetchRange ? prefetchedMonths : [],
        overflowKey,
        viewYear,
        viewMonth
      ),
    [
      gridMonths,
      inPrefetchRange,
      prefetchedMonths,
      overflowKey,
      viewYear,
      viewMonth,
    ]
  )
  const adjacentKeyForView = useMemo(
    () =>
      adjacentMonthsToFetch
        .map(({ year, month }) => monthKey(year, month))
        .sort()
        .join(','),
    [adjacentMonthsToFetch]
  )

  const events = useMemo(() => {
    const byId = new Map<string, TBWCEvent>()
    const extra =
      adjacentMonthsToFetch.length === 0 ? [] : adjacentEvents
    for (const event of [...baseEvents, ...extra]) {
      byId.set(event.id, event)
    }
    return [...byId.values()]
  }, [baseEvents, adjacentEvents, adjacentMonthsToFetch])

  useEffect(() => {
    if (inPrefetchRange) return
    const key = overflowKeyForView
    if (overflowKey === key) return
    let cancelled = false
    fetch(`/api/events/${viewYear}/${viewMonth}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return
        if (data?.success && Array.isArray(data.data)) {
          setOverflowEvents(data.data)
          setOverflowKey(key)
        } else {
          setOverflowEvents([])
          setOverflowKey(key)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setOverflowEvents([])
          setOverflowKey(key)
        }
      })
    return () => {
      cancelled = true
    }
  }, [viewYear, viewMonth, inPrefetchRange, overflowKey, overflowKeyForView])

  useEffect(() => {
    if (adjacentMonthsToFetch.length === 0) return
    if (adjacentKey === adjacentKeyForView) return

    let cancelled = false
    Promise.all(
      adjacentMonthsToFetch.map(({ year, month }) =>
        fetch(`/api/events/${year}/${month}`)
          .then((res) => res.json())
          .then((data) =>
            data?.success && Array.isArray(data.data)
              ? (data.data as TBWCEvent[])
              : []
          )
          .catch(() => [] as TBWCEvent[])
      )
    ).then((results) => {
      if (cancelled) return
      const byId = new Map<string, TBWCEvent>()
      for (const list of results) {
        for (const event of list) {
          byId.set(event.id, event)
        }
      }
      setAdjacentEvents([...byId.values()])
      setAdjacentKey(adjacentKeyForView)
    })

    return () => {
      cancelled = true
    }
  }, [
    viewYear,
    viewMonth,
    adjacentKey,
    adjacentKeyForView,
    adjacentMonthsToFetch,
  ])

  const previousMonth = () => {
    const newMonth = viewMonth === 1 ? 12 : viewMonth - 1
    const newYear = viewMonth === 1 ? viewYear - 1 : viewYear
    navigateToMonth(newYear, newMonth)
  }

  const nextMonth = () => {
    const newMonth = viewMonth === 12 ? 1 : viewMonth + 1
    const newYear = viewMonth === 12 ? viewYear + 1 : viewYear
    navigateToMonth(newYear, newMonth)
  }

  const goToToday = () => {
    const preferred = getPreferredCalendarMonth(serverEvents)
    navigateToMonth(preferred.year, preferred.month)
  }

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  // "Today" must come from the viewer's clock, not from ISR-cached server HTML
  // (see app/page.tsx revalidate). Otherwise the highlight stays on yesterday until the next regen.
  useLayoutEffect(() => {
    const syncToday = () => {
      const next = new Date().toDateString()
      setTodayDateString(next)
      if (
        prevTodayRef.current !== null &&
        prevTodayRef.current !== next
      ) {
        router.refresh()
      }
      prevTodayRef.current = next
    }
    syncToday()
    const id = setInterval(syncToday, 60_000)
    return () => clearInterval(id)
  }, [router])

  useEffect(() => {
    setPastCheckTime(new Date())
    const id = setInterval(() => setPastCheckTime(new Date()), 60_000)
    return () => clearInterval(id)
  }, [referenceTime])

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)')
    const update = () => setIsMobileCalendar(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  const getEventLabelOptions = useCallback(
    (multiDay: boolean, segmentDays = 1) => {
      if (!isMobileCalendar) return { multiDay }
      return {
        multiDay: false,
        ...getMobileNameLimits(multiDay ? segmentDays : 1),
      }
    },
    [isMobileCalendar]
  )

  const getEventsForDate = (date: Date): TBWCEvent[] => {
    const cell = getCalendarDateInTimeZone(date)
    const cellOrd = cell.year * 10000 + cell.month * 100 + cell.day
    return events.filter((event) => {
      const start = getCalendarDateInTimeZone(event.start_time)
      const end = event.end_time
        ? getCalendarDateInTimeZone(event.end_time)
        : start
      const startOrd = start.year * 10000 + start.month * 100 + start.day
      const endOrd = end.year * 10000 + end.month * 100 + end.day
      return cellOrd >= startOrd && cellOrd <= endOrd
    })
  }

  return (
    <div>
      <div className="bg-sky-light border-b border-sky-muted/40 p-6 md:p-8">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex gap-3 items-center">
            <button
              onClick={previousMonth}
              className="border border-gray-300 hover:border-gray-400 bg-white text-gray-800 px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              ← Previous
            </button>
            <button
              onClick={goToToday}
              className="bg-casper-orange hover:bg-casper-orange-hover text-white px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              Today
            </button>
            <button
              onClick={nextMonth}
              className="border border-gray-300 hover:border-gray-400 bg-white text-gray-800 px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              Next →
            </button>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-gray-900">
            {loading ? (
              <span className="text-gray-500">Loading…</span>
            ) : (
              formatCalendarMonthLabel(displayYear, viewMonth)
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {days.map((day) => (
          <div
            key={day}
            className="bg-gray-50 p-4 text-center font-semibold text-gray-600"
          >
            {day}
          </div>
        ))}

        {Array.from({ length: numCells }, (_, i) => {
          const date = new Date(startDate)
          date.setDate(startDate.getDate() + i)
          const cellCal = getCalendarDateInTimeZone(date)
          const isOtherMonth =
            cellCal.year !== viewYear || cellCal.month !== viewMonth
          const isToday =
            todayDateString !== null &&
            date.toDateString() === todayDateString
          const dayEvents = getEventsForDate(date)

          return (
            <div
              key={i}
              className={`min-h-[120px] min-w-0 p-1.5 sm:p-2 lg:p-3 relative transition-all duration-300 ${
                isOtherMonth
                  ? 'bg-gray-50 text-gray-400'
                  : 'bg-white hover:bg-gray-50'
              } ${
                isToday
                  ? 'bg-sky-light border-2 border-sky'
                  : ''
              }`}
            >
              <div className="font-bold text-gray-800 mb-2">
                {cellCal.day}
              </div>

              {(() => {
                const multiDayEvents = dayEvents.filter((event) =>
                  isMultiDayEvent(event)
                )

                const singleDayEvents = dayEvents.filter(
                  (event) => !isMultiDayEvent(event)
                )

                const cellOrd =
                  cellCal.year * 10000 + cellCal.month * 100 + cellCal.day

                const multiDayRowCount = multiDayEvents.length
                const singleDayTopOffset =
                  multiDayRowCount > 0
                    ? multiDayRowCount * MULTI_DAY_ROW_HEIGHT
                    : undefined

                return (
                  <>
                    {multiDayEvents.map((event, index) => {
                      const eventStart = new Date(event.start_time)
                      const eventEnd = event.end_time
                        ? new Date(event.end_time)
                        : eventStart
                      const startCal = getCalendarDateInTimeZone(event.start_time)
                      const endCal = event.end_time
                        ? getCalendarDateInTimeZone(event.end_time)
                        : startCal
                      const segment = getMultiDayEventSegment(
                        cellCal,
                        startCal,
                        endCal,
                        date
                      )
                      if (!segment) return null

                      const { segmentDays } = segment

                      const muted =
                        isEventPastOnCalendar(event, pastCheckTime) ||
                        event.is_cancelled
                      const multiClass = muted
                        ? `text-xs bg-gray-200/90 text-gray-700 ${CALENDAR_EVENT_PADDING_CLASS} rounded-sm mb-1 border border-gray-400/60 absolute hover:bg-gray-300/90 transition-colors cursor-pointer block ${CALENDAR_EVENT_TEXT_CLASS}`
                        : `text-xs bg-sky-light text-gray-800 ${CALENDAR_EVENT_PADDING_CLASS} rounded-sm mb-1 border border-sky absolute hover:bg-sky-muted/30 transition-colors cursor-pointer block ${CALENDAR_EVENT_TEXT_CLASS}`

                      return (
                        <Link
                          key={`multi-${event.id}-${cellOrd}`}
                          href={`/events/${event.id}`}
                          className={multiClass}
                          style={{
                            left: '0',
                            right: `${(segmentDays - 1) * -100}%`,
                            zIndex: 10 + index,
                            width: `${segmentDays * 100}%`,
                            top: `${30 + index * MULTI_DAY_ROW_HEIGHT}px`,
                            minHeight: `${MULTI_DAY_ROW_HEIGHT}px`,
                          }}
                          title={`${event.name} (${eventStart.toLocaleDateString()} - ${eventEnd.toLocaleDateString()})`}
                        >
                          {buildCalendarEventLabel(
                            event,
                            getEventLabelOptions(true, segmentDays)
                          )}
                        </Link>
                      )
                    })}

                    <div
                      style={{
                        marginTop:
                          singleDayTopOffset !== undefined
                            ? `${singleDayTopOffset}px`
                            : undefined,
                      }}
                    >
                      {singleDayEvents.map((event, index) => {
                        const muted =
                          isEventPastOnCalendar(event, pastCheckTime) ||
                          event.is_cancelled
                        const singleClass = muted
                          ? `text-xs bg-gray-200/90 text-gray-700 ${CALENDAR_EVENT_PADDING_CLASS} rounded-sm mb-1 border border-gray-400/60 hover:bg-gray-300/90 transition-colors cursor-pointer block ${CALENDAR_EVENT_TEXT_CLASS}`
                          : `text-xs bg-casper-orange/15 text-gray-800 ${CALENDAR_EVENT_PADDING_CLASS} rounded-sm mb-1 border border-casper-orange/40 hover:bg-casper-orange/25 transition-colors cursor-pointer block ${CALENDAR_EVENT_TEXT_CLASS}`
                        return (
                          <Link
                            key={`single-${index}`}
                            href={`/events/${event.id}`}
                            className={singleClass}
                            style={{
                              marginTop:
                                index > 0 ? `${index * 16}px` : undefined,
                            }}
                            title={event.name}
                          >
                            {buildCalendarEventLabel(
                              event,
                              getEventLabelOptions(false)
                            )}
                          </Link>
                        )
                      })}
                    </div>
                  </>
                )
              })()}
            </div>
          )
        })}
      </div>
    </div>
  )
}

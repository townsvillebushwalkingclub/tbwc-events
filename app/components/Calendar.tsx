'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import type { TBWCEvent } from '@/types/event'

interface CalendarProps {
  currentDate: Date
  events: TBWCEvent[]
  year: number
  month: number
  serverTodayDateString?: string
}

export default function Calendar({
  currentDate,
  events,
  year,
  month,
  serverTodayDateString,
}: CalendarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const navigateToMonth = (newYear: number, newMonth: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('year', newYear.toString())
    params.set('month', newMonth.toString())
    router.push(`/?${params.toString()}`)
  }

  const previousMonth = () => {
    const newMonth = month === 1 ? 12 : month - 1
    const newYear = month === 1 ? year - 1 : year
    navigateToMonth(newYear, newMonth)
  }

  const nextMonth = () => {
    const newMonth = month === 12 ? 1 : month + 1
    const newYear = month === 12 ? year + 1 : year
    navigateToMonth(newYear, newMonth)
  }

  const goToToday = () => {
    const now = new Date()
    navigateToMonth(now.getFullYear(), now.getMonth() + 1)
  }

  const displayYear = year
  const displayMonth = month - 1
  const firstDay = new Date(displayYear, displayMonth, 1)
  const lastDay = new Date(displayYear, displayMonth + 1, 0)
  const startDate = new Date(firstDay)
  const dayOfWeek = firstDay.getDay()
  const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  startDate.setDate(startDate.getDate() - daysToSubtract)

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const todayDateString = serverTodayDateString ?? new Date().toDateString()

  const getEventsForDate = (date: Date): TBWCEvent[] => {
    return events.filter((event) => {
      const eventStart = new Date(event.start_time)
      const eventEnd = event.end_time
        ? new Date(event.end_time)
        : eventStart
      const dateStart = new Date(
        Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
      )
      const eventStartDay = new Date(
        Date.UTC(
          eventStart.getFullYear(),
          eventStart.getMonth(),
          eventStart.getDate()
        )
      )
      const eventEndDay = new Date(
        Date.UTC(
          eventEnd.getFullYear(),
          eventEnd.getMonth(),
          eventEnd.getDate()
        )
      )
      const isInRange =
        dateStart >= eventStartDay && dateStart <= eventEndDay
      return isInRange
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
            {new Date(displayYear, displayMonth).toLocaleDateString('en-AU', {
              month: 'long',
              year: 'numeric',
              timeZone: 'Australia/Brisbane',
            })}
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

        {Array.from({ length: 42 }, (_, i) => {
          const date = new Date(startDate)
          date.setDate(startDate.getDate() + i)
          const isOtherMonth = date.getMonth() !== displayMonth
          const isToday = date.toDateString() === todayDateString
          const dayEvents = getEventsForDate(date)

          return (
            <div
              key={i}
              className={`min-h-[120px] p-3 relative transition-all duration-300 ${
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
                {date.getDate()}
              </div>

              {(() => {
                const multiDayEvents = dayEvents.filter((event) => {
                  const eventStart = new Date(event.start_time)
                  const eventEnd = event.end_time
                    ? new Date(event.end_time)
                    : eventStart
                  const eventStartDay = new Date(
                    Date.UTC(
                      eventStart.getFullYear(),
                      eventStart.getMonth(),
                      eventStart.getDate()
                    )
                  )
                  const eventEndDay = new Date(
                    Date.UTC(
                      eventEnd.getFullYear(),
                      eventEnd.getMonth(),
                      eventEnd.getDate()
                    )
                  )
                  return (
                    event.is_multi_day ||
                    eventStartDay.getTime() !== eventEndDay.getTime()
                  )
                })

                const singleDayEvents = dayEvents.filter((event) => {
                  const eventStart = new Date(event.start_time)
                  const eventEnd = event.end_time
                    ? new Date(event.end_time)
                    : eventStart
                  const eventStartDay = new Date(
                    Date.UTC(
                      eventStart.getFullYear(),
                      eventStart.getMonth(),
                      eventStart.getDate()
                    )
                  )
                  const eventEndDay = new Date(
                    Date.UTC(
                      eventEnd.getFullYear(),
                      eventEnd.getMonth(),
                      eventEnd.getDate()
                    )
                  )
                  return !(
                    event.is_multi_day ||
                    eventStartDay.getTime() !== eventEndDay.getTime()
                  )
                })

                const dateStart = new Date(
                  Date.UTC(
                    date.getFullYear(),
                    date.getMonth(),
                    date.getDate()
                  )
                )

                return (
                  <>
                    {multiDayEvents.map((event, index) => {
                      const eventStart = new Date(event.start_time)
                      const eventEnd = event.end_time
                        ? new Date(event.end_time)
                        : eventStart
                      const eventStartDay = new Date(
                        Date.UTC(
                          eventStart.getFullYear(),
                          eventStart.getMonth(),
                          eventStart.getDate()
                        )
                      )
                      const isFirstDay =
                        dateStart.getTime() === eventStartDay.getTime()
                      if (!isFirstDay) return null

                      const daysDiff =
                        Math.ceil(
                          (eventEnd.getTime() - eventStart.getTime()) /
                            (1000 * 60 * 60 * 24)
                        ) + 1

                      return (
                        <Link
                          key={`multi-${index}`}
                          href={`/events/${event.id}`}
                          className="text-xs bg-sky-light text-gray-800 px-2 py-1 rounded-sm mb-1 border border-sky absolute hover:bg-sky-muted/30 transition-colors cursor-pointer block"
                          style={{
                            left: '0',
                            right: `${(daysDiff - 1) * -100}%`,
                            zIndex: 10 + index,
                            width: `${daysDiff * 100}%`,
                            top: `${30 + index * 20}px`,
                          }}
                          title={`${event.name} (${eventStart.toLocaleDateString()} - ${eventEnd.toLocaleDateString()})`}
                        >
                          {event.name.length > 25
                            ? event.name.substring(0, 25) + '...'
                            : event.name}
                          {event.is_cancelled && ' (CANCELLED)'} (Multi-day)
                        </Link>
                      )
                    })}

                    {singleDayEvents.map((event, index) => (
                      <Link
                        key={`single-${index}`}
                        href={`/events/${event.id}`}
                        className="text-xs bg-casper-orange/15 text-gray-800 px-2 py-1 rounded-sm mb-1 border border-casper-orange/40 hover:bg-casper-orange/25 transition-colors cursor-pointer block"
                        style={{ marginTop: `${index * 16}px` }}
                        title={event.name}
                      >
                        {event.name.length > 15
                          ? event.name.substring(0, 15) + '...'
                          : event.name}
                        {event.is_cancelled && ' (CANCELLED)'}
                      </Link>
                    ))}
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

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import EventsList from './EventsList'
import type { TBWCEvent } from '@/types/event'

interface EventSearchProps {
  initialEvents: TBWCEvent[]
  currentDate: Date
  initialSearchQuery?: string | null
  /** When set, "Clear search" navigates here instead of "/" */
  clearToPath?: string
  /** ISO timestamp from the server render; passed through for hydration-safe past checks. */
  referenceTime: string
  /** When true, hide the default month event list until a search is active. */
  searchOnly?: boolean
}

export default function EventSearch({
  initialEvents,
  currentDate,
  initialSearchQuery = null,
  clearToPath = '/',
  referenceTime,
  searchOnly = false,
}: EventSearchProps) {
  const router = useRouter()
  const trimmedQuery = initialSearchQuery?.trim() ?? ''
  const [searchResults, setSearchResults] = useState<TBWCEvent[] | null>(null)
  const [fetchedFor, setFetchedFor] = useState('')

  useEffect(() => {
    if (!trimmedQuery) return

    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(
          `/api/events/search?q=${encodeURIComponent(trimmedQuery)}`
        )
        const json = await res.json()
        if (cancelled) return
        if (json.success && Array.isArray(json.data)) {
          setSearchResults(json.data)
        } else {
          setSearchResults([])
        }
        setFetchedFor(trimmedQuery)
      } catch (err) {
        console.error('Search failed:', err)
        if (!cancelled) {
          setSearchResults([])
          setFetchedFor(trimmedQuery)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [trimmedQuery])

  const handleClear = () => {
    router.push(clearToPath)
  }

  const isSearchMode = !!trimmedQuery
  const isSearching = isSearchMode && fetchedFor !== trimmedQuery
  const searchReady = isSearchMode && fetchedFor === trimmedQuery
  const showMonthList = !searchOnly && !isSearchMode
  const showEventsList = showMonthList || searchReady

  return (
    <div className="w-full">
      {searchReady && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg bg-sky-light px-4 py-2 text-sm text-gray-800">
          <span>
            {searchResults!.length === 0
              ? `No events found for "${trimmedQuery}".`
              : `Found ${searchResults!.length} event${searchResults!.length === 1 ? '' : 's'} for "${trimmedQuery}".`}
          </span>
          <button
            type="button"
            onClick={handleClear}
            className="rounded-lg bg-casper-orange hover:bg-casper-orange-hover text-white px-3 py-1.5 font-semibold transition-colors"
          >
            Clear search
          </button>
        </div>
      )}

      {isSearchMode && isSearching && (
        <div className="mb-4 text-center text-gray-500">Searching...</div>
      )}

      {showEventsList && (
        <EventsList
          events={searchReady ? searchResults! : initialEvents}
          currentDate={currentDate}
          titleOverride={searchReady ? `Search: ${trimmedQuery}` : null}
          referenceTime={referenceTime}
        />
      )}
    </div>
  )
}

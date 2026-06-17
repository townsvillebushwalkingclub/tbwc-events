'use client'

import { useState, useCallback, useEffect } from 'react'
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
}

export default function EventSearch({
  initialEvents,
  currentDate,
  initialSearchQuery = null,
  clearToPath = '/',
  referenceTime,
}: EventSearchProps) {
  const router = useRouter()
  const [searchResults, setSearchResults] = useState<TBWCEvent[] | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const runSearch = useCallback(async (q: string) => {
    const trimmed = (q || '').trim()
    if (!trimmed) {
      setSearchResults(null)
      setSearchTerm('')
      return
    }
    setIsSearching(true)
    setSearchTerm(trimmed)
    try {
      const res = await fetch(
        `/api/events/search?q=${encodeURIComponent(trimmed)}`
      )
      const json = await res.json()
      if (json.success && Array.isArray(json.data)) {
        setSearchResults(json.data)
      } else {
        setSearchResults([])
      }
    } catch (err) {
      console.error('Search failed:', err)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  useEffect(() => {
    if (initialSearchQuery?.trim()) {
      runSearch(initialSearchQuery.trim())
    } else {
      setSearchResults(null)
      setSearchTerm('')
    }
  }, [initialSearchQuery, runSearch])

  const handleClear = () => {
    router.push(clearToPath)
    setSearchResults(null)
    setSearchTerm('')
  }

  const isSearchMode = !!initialSearchQuery?.trim()
  const searchReady = isSearchMode && searchResults !== null
  const showMonthList = !isSearchMode
  const showEventsList = showMonthList || searchReady

  return (
    <div className="w-full">
      {searchReady && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg bg-sky-light px-4 py-2 text-sm text-gray-800">
          <span>
            {searchResults!.length === 0
              ? `No events found for "${searchTerm}".`
              : `Found ${searchResults!.length} event${searchResults!.length === 1 ? '' : 's'} for "${searchTerm}".`}
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
          referenceTime={referenceTime}
          titleOverride={
            searchReady
              ? `Search results${searchTerm ? ` for "${searchTerm}"` : ''}`
              : null
          }
        />
      )}
    </div>
  )
}

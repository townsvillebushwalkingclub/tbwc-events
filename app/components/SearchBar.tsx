'use client'

import { useState, FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const SEARCH_PAGE = '/events/search'

export default function SearchBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlQuery = searchParams.get('q') || searchParams.get('search') || ''
  const [query, setQuery] = useState(urlQuery)
  const [prevUrlQuery, setPrevUrlQuery] = useState(urlQuery)

  if (urlQuery !== prevUrlQuery) {
    setPrevUrlQuery(urlQuery)
    setQuery(urlQuery)
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const trimmed = (query || '').trim()
    if (trimmed) {
      router.push(`${SEARCH_PAGE}?q=${encodeURIComponent(trimmed)}`)
    } else {
      router.push(SEARCH_PAGE)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 mb-6 flex flex-wrap items-center justify-center gap-3"
    >
      <div className="relative w-full max-w-xl">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search events (name, description, location)..."
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 pr-10 text-gray-900 placeholder-gray-500 focus:border-casper-orange focus:outline-none focus:ring-1 focus:ring-casper-orange"
          aria-label="Search events"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
          🔍
        </span>
      </div>
      <button
        type="submit"
        className="rounded-lg bg-casper-orange hover:bg-casper-orange-hover text-white px-5 py-3 font-semibold transition-colors"
      >
        Search
      </button>
    </form>
  )
}

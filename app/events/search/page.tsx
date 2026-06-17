import Link from 'next/link'
import Image from 'next/image'
import { Suspense } from 'react'
import EventSearch from '@/app/components/EventSearch'
import SearchBar from '@/app/components/SearchBar'
import type { Metadata } from 'next'

const PAGE_URL = 'https://events.townsvillebushwalkingclub.com/events/search'

export const metadata: Metadata = {
  title: 'Search events – Townsville Bushwalking Club',
  description:
    'Search Townsville Bushwalking Club events by name, description, or location. Find bushwalks, hikes, and outdoor activities in Townsville and North Queensland.',
  alternates: {
    canonical: '/events/search',
  },
  openGraph: {
    title: 'Search events – Townsville Bushwalking Club',
    description:
      'Search Townsville Bushwalking Club events by name, description, or location. Find bushwalks, hikes, and outdoor activities in Townsville and North Queensland.',
    url: PAGE_URL,
    siteName: 'Townsville Bushwalking Club Events',
    locale: 'en_AU',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Search events – Townsville Bushwalking Club',
    description:
      'Search Townsville Bushwalking Club events by name, description, or location.',
  },
}

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams
  const query = params?.q?.trim() || null
  const now = new Date()
  const currentDate = now

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 md:px-8 py-4 md:py-8 max-w-4xl">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
          >
            ← Back to calendar
          </Link>
        </div>

        <div className="flex flex-col items-center mb-8">
          <Link
            href="/"
            className="relative w-16 h-16 flex items-center justify-center mb-3 focus:outline-none focus:ring-2 focus:ring-casper-orange focus:ring-offset-2 rounded-lg"
            aria-label="Go to homepage"
          >
            <Image
              src="/townsville-bushwalking-club-logo.png"
              alt="Townsville Bushwalking Club"
              width={64}
              height={64}
              className="object-contain"
            />
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-[rgb(var(--foreground-rgb))]">
            Search events
          </h1>
          <p className="text-gray-600 mt-1">Townsville Bushwalking Club</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-8 shadow-sm">
          <Suspense fallback={null}>
            <SearchBar />
          </Suspense>
          <EventSearch
            initialEvents={[]}
            currentDate={currentDate}
            initialSearchQuery={query}
            clearToPath="/events/search"
            referenceTime={now.toISOString()}
          />
        </div>

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

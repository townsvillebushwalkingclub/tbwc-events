import Link from 'next/link'

export default function SiteFooter() {
  return (
    <footer className="mt-12 pt-6 border-t border-gray-100">
      <nav
        aria-label="Site links"
        className="text-center flex flex-wrap items-center justify-center gap-x-4 gap-y-1"
      >
        <Link
          href="/"
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          Calendar
        </Link>
        <Link
          href="/events/all"
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          All Events
        </Link>
        <Link
          href="/events/search"
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          Search
        </Link>
      </nav>
    </footer>
  )
}

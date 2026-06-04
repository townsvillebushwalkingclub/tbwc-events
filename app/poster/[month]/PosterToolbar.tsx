'use client'

import Link from 'next/link'
import {
  formatPosterMonthSlug,
  type PosterMonth,
} from '@/lib/poster-month'

interface PosterToolbarProps {
  prev: PosterMonth
  next: PosterMonth
  excludeQuery: string
}

export default function PosterToolbar({
  prev,
  next,
  excludeQuery,
}: PosterToolbarProps) {
  return (
    <div className="poster-toolbar no-print">
      <button type="button" onClick={() => window.print()}>
        Print / save as PDF
      </button>
      <Link
        href={`/poster/${formatPosterMonthSlug(prev.year, prev.month)}${excludeQuery}`}
      >
        Previous month
      </Link>
      <Link
        href={`/poster/${formatPosterMonthSlug(next.year, next.month)}${excludeQuery}`}
      >
        Next month
      </Link>
      <Link href="/">Back to calendar</Link>
    </div>
  )
}

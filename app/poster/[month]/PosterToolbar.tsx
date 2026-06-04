'use client'

import Link from 'next/link'
import {
  formatPosterMonthSlug,
  type PosterMonth,
} from '@/lib/poster-month'

interface PosterToolbarProps {
  anchor: PosterMonth
  prev: PosterMonth
  next: PosterMonth
}

export default function PosterToolbar({
  anchor,
  prev,
  next,
}: PosterToolbarProps) {
  return (
    <div className="poster-toolbar no-print">
      <button type="button" onClick={() => window.print()}>
        Print / save as PDF
      </button>
      <Link href={`/poster/${formatPosterMonthSlug(prev.year, prev.month)}`}>
        Previous month
      </Link>
      <Link href={`/poster/${formatPosterMonthSlug(next.year, next.month)}`}>
        Next month
      </Link>
      <Link href="/">Back to calendar</Link>
    </div>
  )
}

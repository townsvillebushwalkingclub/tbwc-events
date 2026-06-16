'use client'

import Link from 'next/link'
import {
  formatPosterMonthSlug,
  type PosterMonth,
} from '@/lib/poster-month'
import PosterAiDownloadButton, {
  type PosterAiDownloadProps,
} from './PosterAiDownloadButton'

interface PosterToolbarProps {
  prev: PosterMonth
  next: PosterMonth
  excludeQuery: string
  aiDownload: PosterAiDownloadProps
}

export default function PosterToolbar({
  prev,
  next,
  excludeQuery,
  aiDownload,
}: PosterToolbarProps) {
  return (
    <div className="poster-toolbar no-print">
      <Link href="/" className="poster-toolbar-brand">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/townsville-bushwalking-club-logo.png"
          alt="Townsville Bushwalking Club"
          className="poster-toolbar-logo"
          width={40}
          height={40}
        />
        <span className="poster-toolbar-brand-text">
          Townsville Bushwalking Club
        </span>
      </Link>
      <div className="poster-toolbar-actions">
        <button type="button" onClick={() => window.print()}>
          Print / save as PDF
        </button>
        <PosterAiDownloadButton {...aiDownload} />
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
    </div>
  )
}

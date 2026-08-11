'use client'

import Link from 'next/link'
import {
  formatPosterMonthSlug,
  type PosterMonth,
} from '@/lib/poster-month'
import { appendPosterThemeToQuery, POSTER_THEME_IDS, POSTER_THEMES } from '@/lib/poster-themes'
import PosterAiDownloadButton, {
  type PosterAiDownloadProps,
} from './PosterAiDownloadButton'
import { usePosterTheme } from './PosterThemeProvider'

interface PosterToolbarProps {
  prev: PosterMonth
  next: PosterMonth
  filterQuery: string
  aiDownload: PosterAiDownloadProps
}

export default function PosterToolbar({
  prev,
  next,
  filterQuery,
  aiDownload,
}: PosterToolbarProps) {
  const { theme, setTheme } = usePosterTheme()
  const navQuery = appendPosterThemeToQuery(filterQuery, theme)

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
        <div
          className="poster-toolbar-theme-toggle"
          role="group"
          aria-label="Poster theme"
        >
          {POSTER_THEME_IDS.map((id) => (
            <button
              key={id}
              type="button"
              className={`poster-toolbar-theme-button${theme === id ? ' poster-toolbar-theme-button--active' : ''}`}
              onClick={() => setTheme(id)}
              aria-pressed={theme === id}
            >
              {POSTER_THEMES[id]}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => window.print()}>
          Print / save as PDF
        </button>
        <PosterAiDownloadButton {...aiDownload} />
        <Link
          href={`/poster/${formatPosterMonthSlug(prev.year, prev.month)}${navQuery}`}
        >
          Previous month
        </Link>
        <Link
          href={`/poster/${formatPosterMonthSlug(next.year, next.month)}${navQuery}`}
        >
          Next month
        </Link>
        <Link href="/">Back to calendar</Link>
      </div>
    </div>
  )
}

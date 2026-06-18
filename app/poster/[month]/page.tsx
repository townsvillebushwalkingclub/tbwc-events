import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { FACEBOOK_EVENTS_REVALIDATE_SECONDS } from '@/lib/facebook-api'
import { getPosterLayout } from '@/lib/poster-layout'
import type { PosterAiDownloadEvent } from '@/lib/poster-ai-prompt'
import {
  addMonths,
  formatPosterDateTime,
  formatPosterFeatureDate,
  formatPosterMonthLabel,
  formatPosterMonthSlug,
  formatPosterNextMonthLine,
  getCurrentPosterMonth,
  getPosterEventsForMonth,
  parsePosterMonthParam,
  truncatePosterDescription,
} from '@/lib/poster-utils'
import {
  extractPosterEventContact,
  stripPosterContactLines,
} from '@/lib/poster-description-parse'
import type { TBWCEvent } from '@/types/event'
import PosterPage from './PosterPage'

/** Match Facebook events in-memory cache (24h) for instant ISR loads. */
export const revalidate = FACEBOOK_EVENTS_REVALIDATE_SECONDS

interface PageProps {
  params: Promise<{ month: string }>
}

export function generateStaticParams() {
  const { year, month } = getCurrentPosterMonth()
  return [-2, -1, 0, 1, 2].map((delta) => {
    const { year: y, month: m } = addMonths(year, month, delta)
    return { month: formatPosterMonthSlug(y, m) }
  })
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { month } = await params
  const anchor = parsePosterMonthParam(month)
  if (!anchor) {
    return { title: 'TBWC Events Poster' }
  }
  const label = formatPosterMonthLabel(anchor.year, anchor.month)
  return {
    title: `TBWC Events Poster – ${label}`,
  }
}

export default async function PosterMonthPage({ params }: PageProps) {
  const { month } = await params
  const anchor = parsePosterMonthParam(month)
  if (!anchor) notFound()

  const poster = await getPosterEventsForMonth(anchor)
  const prev = addMonths(anchor.year, anchor.month, -1)
  const next = addMonths(anchor.year, anchor.month, 1)
  const layout = getPosterLayout(poster.currentMonth.length)
  const useFeatureDate = layout.showDescription

  const aiDownloadEvents: PosterAiDownloadEvent[] = poster.currentMonth.map(
    (event) => toAiDownloadEvent(event, useFeatureDate)
  )

  return (
    <PosterPage
      prev={prev}
      next={next}
      aiDownload={{
        monthSlug: formatPosterMonthSlug(anchor.year, anchor.month),
        anchorLabel: poster.anchorLabel,
        currentEvents: aiDownloadEvents,
        nextEvents: poster.nextMonth.map((event) => ({
          name: event.name,
          dateLine: formatPosterNextMonthLine(event),
        })),
        nextMonthLabel: poster.nextMonthLabel,
      }}
      anchorLabel={poster.anchorLabel}
      currentEvents={poster.currentMonth}
      nextEvents={poster.nextMonth}
      nextMonthLabel={poster.nextMonthLabel}
    />
  )
}

function toAiDownloadEvent(
  event: TBWCEvent,
  useFeatureDate: boolean
): PosterAiDownloadEvent {
  const dateLine = useFeatureDate
    ? formatPosterFeatureDate(event)
    : formatPosterDateTime(event)
  const contact = extractPosterEventContact(event.description)
  const description =
    useFeatureDate && event.description
      ? truncatePosterDescription(stripPosterContactLines(event.description))
      : undefined

  return {
    id: event.id,
    name: event.name,
    coverUrl: event.cover?.source ?? null,
    dateLine,
    description,
    leaders: contact.leaders,
    emails: contact.emails,
  }
}

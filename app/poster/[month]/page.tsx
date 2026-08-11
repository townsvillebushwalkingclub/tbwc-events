import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getPosterLayout } from '@/lib/poster-layout'
import type { PosterAiDownloadEvent } from '@/lib/poster-ai-prompt'
import {
  moveFeaturedFirst,
  parsePosterFeaturedParam,
  parsePosterIncludeParam,
} from '@/lib/poster-query'
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


/** Match site-wide Facebook events revalidate interval for ISR loads. */
export const revalidate = 21600 // FACEBOOK_EVENTS_REVALIDATE_SECONDS

interface PageProps {
  params: Promise<{ month: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
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

export default async function PosterMonthPage({
  params,
  searchParams,
}: PageProps) {
  const { month } = await params
  const query = await searchParams
  const anchor = parsePosterMonthParam(month)
  if (!anchor) notFound()

  const includeIds = parsePosterIncludeParam(query.include)
  const featuredId = parsePosterFeaturedParam(query.featured)
  if (featuredId) includeIds.add(featuredId)

  const poster = await getPosterEventsForMonth(
    anchor,
    new Set(),
    includeIds
  )
  const currentEvents = moveFeaturedFirst(poster.currentMonth, featuredId)
  const prev = addMonths(anchor.year, anchor.month, -1)
  const next = addMonths(anchor.year, anchor.month, 1)
  const layout = getPosterLayout(currentEvents.length)
  const useFeatureDate = layout.showDescription

  const aiDownloadEvents: PosterAiDownloadEvent[] = currentEvents.map(
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
      currentEvents={currentEvents}
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

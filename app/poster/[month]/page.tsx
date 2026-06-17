import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getPosterLayout } from '@/lib/poster-layout'
import type { PosterAiDownloadEvent } from '@/lib/poster-ai-prompt'
import {
  addMonths,
  formatPosterExcludeQuery,
  formatPosterDateTime,
  formatPosterFeatureDate,
  formatPosterMonthLabel,
  formatPosterMonthSlug,
  formatPosterNextMonthLine,
  getPosterEventsForMonth,
  parsePosterExcludeParam,
  parsePosterMonthParam,
  truncatePosterDescription,
} from '@/lib/poster-utils'
import type { TBWCEvent } from '@/types/event'
import PosterPage from './PosterPage'

export const revalidate = 21600

interface PageProps {
  params: Promise<{ month: string }>
  searchParams: Promise<{ exclude?: string | string[] }>
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
  const anchor = parsePosterMonthParam(month)
  if (!anchor) notFound()

  const excludeIds = parsePosterExcludeParam((await searchParams).exclude)
  const excludeQuery = formatPosterExcludeQuery(excludeIds)
  const poster = await getPosterEventsForMonth(anchor, excludeIds)
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
      excludeQuery={excludeQuery}
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
  const description =
    useFeatureDate && event.description
      ? truncatePosterDescription(event.description)
      : undefined

  return {
    id: event.id,
    name: event.name,
    coverUrl: event.cover?.source ?? null,
    dateLine,
    description,
  }
}

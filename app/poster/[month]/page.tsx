import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import {
  addMonths,
  formatPosterMonthLabel,
  getPosterDensity,
  getPosterEventsForMonth,
  parsePosterMonthParam,
} from '@/lib/poster-utils'
import PosterContent from './PosterContent'
import PosterToolbar from './PosterToolbar'

export const revalidate = 21600

interface PageProps {
  params: Promise<{ month: string }>
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
  const density = getPosterDensity(poster.currentMonth.length)
  const prev = addMonths(anchor.year, anchor.month, -1)
  const next = addMonths(anchor.year, anchor.month, 1)

  return (
    <>
      <PosterToolbar anchor={anchor} prev={prev} next={next} />
      <PosterContent
        anchorLabel={poster.anchorLabel}
        currentEvents={poster.currentMonth}
        nextEvents={poster.nextMonth}
        nextMonthLabel={poster.nextMonthLabel}
        density={density}
      />
    </>
  )
}

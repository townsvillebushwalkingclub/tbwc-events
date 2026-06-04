import { redirect } from 'next/navigation'
import {
  formatPosterMonthSlug,
  getCurrentPosterMonth,
} from '@/lib/poster-month'

export default function PosterIndexPage() {
  const { year, month } = getCurrentPosterMonth()
  redirect(`/poster/${formatPosterMonthSlug(year, month)}`)
}

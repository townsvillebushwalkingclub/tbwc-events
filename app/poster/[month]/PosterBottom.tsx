import type { TBWCEvent } from '@/types/event'
import PosterFooter from './PosterFooter'
import PosterNextMonth from './PosterNextMonth'

interface PosterBottomProps {
  nextMonthLabel: string
  nextEvents: TBWCEvent[]
}

export default function PosterBottom({
  nextMonthLabel,
  nextEvents,
}: PosterBottomProps) {
  return (
    <div className="poster-bottom">
      <PosterNextMonth label={nextMonthLabel} events={nextEvents} />
      <PosterFooter />
    </div>
  )
}

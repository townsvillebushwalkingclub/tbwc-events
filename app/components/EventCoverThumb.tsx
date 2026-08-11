import Image from 'next/image'
import type { EventCover } from '@/types/event'

interface EventCoverThumbProps {
  cover: EventCover | null | undefined
}

export default function EventCoverThumb({ cover }: EventCoverThumbProps) {
  const source = cover?.source

  return (
    <span className="relative block size-10 shrink-0 aspect-square overflow-hidden rounded-md bg-gray-200">
      {source ? (
        <Image
          src={source}
          alt=""
          fill
          sizes="40px"
          quality={75}
          className="object-cover"
          style={{ objectFit: 'cover' }}
          unoptimized={!source.startsWith('/event-covers/')}
        />
      ) : null}
    </span>
  )
}

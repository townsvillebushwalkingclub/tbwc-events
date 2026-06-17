interface PosterIconProps {
  className?: string
}

export function PosterMountainIcon({ className }: PosterIconProps) {
  return (
    <span className={className} aria-hidden>
      <svg viewBox="0 0 24 24" focusable="false" aria-hidden>
        <path
          fill="currentColor"
          d="M12 2.5 3 20h6l2.5-5 2.5 4.5L16 12l2 3.5h5L12 2.5zm0 5.2 5.8 10.3h-3.1l-2.2-4-2.2 4H6.2L12 7.7z"
        />
      </svg>
    </span>
  )
}

export function PosterHikerIcon({ className }: PosterIconProps) {
  return (
    <span className={className} aria-hidden>
      <svg viewBox="0 0 24 24" focusable="false" aria-hidden>
        <path
          fill="currentColor"
          d="M13.25 5.25a1.75 1.75 0 1 1-3.5 0 1.75 1.75 0 0 1 3.5 0ZM9.2 9.1l-1.2 5.4h2.1l.6-2.7 2.8 5.1 1.7-1-2.3-4.1 2.2-2.6h-2.8l-2.1-2.4h-3.6l3.4 4.4Z"
        />
      </svg>
    </span>
  )
}

export function PosterHeroCalendarIcon({ className }: PosterIconProps) {
  return (
    <span className={className} aria-hidden>
      <svg viewBox="0 0 24 24" focusable="false" aria-hidden>
        <path
          fill="currentColor"
          d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 16H5V10h14v10ZM7 12h2v2H7v-2Zm4 0h2v2h-2v-2Zm4 0h2v2h-2v-2ZM7 16h2v2H7v-2Zm4 0h2v2h-2v-2Z"
        />
      </svg>
    </span>
  )
}

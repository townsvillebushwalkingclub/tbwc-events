import { POSTER_LOGO_PATH } from '@/lib/poster-constants'
import { PosterMountainIcon } from './PosterIcons'

interface PosterHeaderProps {
  anchorLabel: string
}

export default function PosterHeader({ anchorLabel }: PosterHeaderProps) {
  return (
    <header className="poster-header">
      <div className="poster-header-row">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={POSTER_LOGO_PATH}
          alt="Townsville Bushwalking Club"
          className="poster-logo"
          width={200}
          height={44}
        />
        <div className="poster-header-text">
          <h1 className="poster-title">Townsville Bushwalking Club</h1>
          <p className="poster-subtitle">
            Walks, adventures &amp; social events
          </p>
        </div>
        <p className="poster-month-badge">
          <PosterMountainIcon className="poster-month-badge-icon" />
          {anchorLabel}
        </p>
      </div>
    </header>
  )
}

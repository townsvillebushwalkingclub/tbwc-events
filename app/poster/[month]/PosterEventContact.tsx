import type { PosterEventContact as PosterEventContactInfo } from '@/lib/poster-description-parse'

interface PosterEventContactProps {
  contact: PosterEventContactInfo
  className?: string
  variant?: 'default' | 'hero'
}

export default function PosterEventContact({
  contact,
  className = '',
  variant = 'default',
}: PosterEventContactProps) {
  const { leaders, emails } = contact
  if (leaders.length === 0 && emails.length === 0) return null

  const leaderLabel = leaders.length > 1 ? 'Leaders' : 'Leader'

  return (
    <div
      className={`poster-event-contact poster-event-contact--${variant}${className ? ` ${className}` : ''}`}
    >
      {leaders.length > 0 && (
        <p className="poster-event-leaders">
          <span className="poster-event-contact-label">{leaderLabel}:</span>{' '}
          {leaders.join(', ')}
        </p>
      )}
      {emails.length > 0 && (
        <p className="poster-event-emails">
          <span className="poster-event-contact-label">RSVP:</span>{' '}
          {emails.join(', ')}
        </p>
      )}
    </div>
  )
}

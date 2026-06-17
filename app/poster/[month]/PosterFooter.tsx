import {
  POSTER_CASTLE_HILL_PATH,
  POSTER_HILLS_PATH,
  POSTER_QR_URL,
} from '@/lib/poster-constants'
import PosterQr from './PosterQr'

export default function PosterFooter() {
  return (
    <footer className="poster-footer">
      <div className="poster-footer-decor" aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={POSTER_CASTLE_HILL_PATH}
          alt=""
          className="poster-footer-decor-saint"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={POSTER_HILLS_PATH}
          alt=""
          className="poster-footer-decor-hills"
        />
        <div className="poster-footer-decor-hills-mirror" aria-hidden>
          <div className="poster-footer-decor-hills-mirror-inner">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={POSTER_HILLS_PATH}
              alt=""
              className="poster-footer-decor-hills-mirror-img"
            />
          </div>
        </div>
      </div>
      <a
        href={POSTER_QR_URL}
        className="poster-footer-link"
        aria-label="Full event details and RSVP on townsvillebushwalkingclub.com"
      >
        <p className="poster-footer-cta">
          <span className="poster-footer-globe" aria-hidden>
            🌐
          </span>
          Full details &amp; RSVP
        </p>
        <p className="poster-footer-url">townsvillebushwalkingclub.com/calendar/</p>
      </a>
      <div className="poster-footer-qr-group">
        <PosterQr />
        <p className="poster-footer-scan-me" aria-hidden>
          Scan me!
        </p>
      </div>
    </footer>
  )
}

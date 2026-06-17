import { POSTER_LEAF_14_PATH, POSTER_LEAF_6_PATH } from '@/lib/poster-constants'

export default function PosterDecorations() {
  return (
    <div className="poster-decorations" aria-hidden>
      <div className="poster-decor-contour-bg" />
      <div className="poster-decor-header-blob" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={POSTER_LEAF_6_PATH}
        alt=""
        className="poster-decor-leaf poster-decor-leaf--hero"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={POSTER_LEAF_14_PATH}
        alt=""
        className="poster-decor-leaf poster-decor-leaf--footer"
      />
    </div>
  )
}

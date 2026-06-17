'use client'

import { useEffect, useState } from 'react'
import { generatePosterQrSvg } from '@/lib/poster-qr'

export default function PosterQr() {
  const [svg, setSvg] = useState('')

  useEffect(() => {
    generatePosterQrSvg().then(setSvg).catch(console.error)
  }, [])

  return (
    <div
      className="poster-qr-wrap"
      aria-label="QR code for townsvillebushwalkingclub.com/calendar/"
    >
      {svg ? (
        <div
          className="poster-qr"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : (
        <div className="poster-qr poster-qr--loading" aria-hidden />
      )}
    </div>
  )
}

import QRCode from 'qrcode'
import { POSTER_QR_URL } from '@/lib/poster-constants'

export default async function PosterQr() {
  const svg = await QRCode.toString(POSTER_QR_URL, {
    type: 'svg',
    margin: 1,
    errorCorrectionLevel: 'M',
  })

  return (
    <div
      className="poster-qr-wrap"
      aria-label={`QR code for ${POSTER_QR_URL}`}
    >
      <div
        className="poster-qr"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </div>
  )
}

import QRCode from 'qrcode'
import { POSTER_QR_URL } from '@/lib/poster-constants'

const QR_OPTIONS = {
  margin: 1,
  errorCorrectionLevel: 'M' as const,
}

export async function generatePosterQrSvg(
  url: string = POSTER_QR_URL
): Promise<string> {
  return QRCode.toString(url, { type: 'svg', ...QR_OPTIONS })
}

export async function generatePosterQrPngBlob(
  url: string = POSTER_QR_URL
): Promise<Blob> {
  const dataUrl = await QRCode.toDataURL(url, {
    type: 'image/png',
    width: 512,
    ...QR_OPTIONS,
  })
  const response = await fetch(dataUrl)
  return response.blob()
}

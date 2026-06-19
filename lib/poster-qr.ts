import QRCode from 'qrcode'
import { POSTER_QR_URL } from '@/lib/poster-constants'

const QR_OPTIONS = {
  margin: 1,
  errorCorrectionLevel: 'M' as const,
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',')
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/png'
  const bytes = atob(base64)
  const buffer = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) {
    buffer[i] = bytes.charCodeAt(i)
  }
  return new Blob([buffer], { type: mime })
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
  return dataUrlToBlob(dataUrl)
}

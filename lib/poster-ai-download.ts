import JSZip from 'jszip'
import {
  POSTER_LOGO_FILENAME,
  POSTER_LOGO_PATH,
  POSTER_QR_FILENAME,
} from '@/lib/poster-constants'
import { posterCoverFilename, type PosterAiDownloadEvent } from '@/lib/poster-ai-prompt'
import { generatePosterQrPngBlob } from '@/lib/poster-qr'

export interface BuildPosterAiKitZipInput {
  prompt: string
  currentEvents: PosterAiDownloadEvent[]
}

export async function buildPosterAiKitZip(
  input: BuildPosterAiKitZipInput
): Promise<Blob> {
  const { prompt, currentEvents } = input
  const zip = new JSZip()

  const logoResponse = await fetch(POSTER_LOGO_PATH)
  if (logoResponse.ok) {
    zip.file(POSTER_LOGO_FILENAME, await logoResponse.blob())
  } else {
    console.warn(`Failed to fetch club logo: ${logoResponse.status}`)
  }

  const qrBlob = await generatePosterQrPngBlob()
  zip.file(POSTER_QR_FILENAME, qrBlob)

  for (let i = 0; i < currentEvents.length; i++) {
    const event = currentEvents[i]
    const filename = posterCoverFilename(i, event)
    if (!filename || !event.coverUrl) continue

    const response = await fetch(event.coverUrl)
    if (!response.ok) {
      console.warn(`Failed to fetch cover for ${event.name}: ${response.status}`)
      continue
    }
    zip.file(filename, await response.blob())
  }

  zip.file('poster-ai-prompt.txt', prompt)

  return zip.generateAsync({ type: 'blob' })
}

'use client'

import { useCallback, useState } from 'react'
import JSZip from 'jszip'
import {
  buildPosterAiPrompt,
  posterCoverFilename,
  type PosterAiDownloadEvent,
} from '@/lib/poster-ai-prompt'
import { POSTER_LOGO_FILENAME, POSTER_LOGO_PATH } from '@/lib/poster-constants'

export interface PosterAiDownloadProps {
  monthSlug: string
  anchorLabel: string
  currentEvents: PosterAiDownloadEvent[]
  nextEvents: { name: string; dateLine: string }[]
  nextMonthLabel: string
}

type ButtonStatus = 'idle' | 'working' | 'done' | 'error'

async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  document.body.removeChild(textarea)
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export default function PosterAiDownloadButton({
  monthSlug,
  anchorLabel,
  currentEvents,
  nextEvents,
  nextMonthLabel,
}: PosterAiDownloadProps) {
  const [status, setStatus] = useState<ButtonStatus>('idle')
  const [statusMessage, setStatusMessage] = useState('')

  const handleDownload = useCallback(async () => {
    setStatus('working')
    setStatusMessage('Preparing…')

    try {
      const prompt = buildPosterAiPrompt({
        anchorLabel,
        currentEvents,
        nextEvents,
        nextMonthLabel,
      })

      await copyToClipboard(prompt)
      setStatusMessage('Copied! Downloading…')

      const zip = new JSZip()

      const logoResponse = await fetch(POSTER_LOGO_PATH)
      if (logoResponse.ok) {
        zip.file(POSTER_LOGO_FILENAME, await logoResponse.blob())
      } else {
        console.warn(`Failed to fetch club logo: ${logoResponse.status}`)
      }

      for (let i = 0; i < currentEvents.length; i++) {
        const event = currentEvents[i]
        const filename = posterCoverFilename(i, event)
        if (!filename || !event.coverUrl) continue

        const response = await fetch(event.coverUrl)
        if (!response.ok) {
          console.warn(`Failed to fetch cover for ${event.name}: ${response.status}`)
          continue
        }
        const blob = await response.blob()
        zip.file(filename, blob)
      }

      zip.file('poster-ai-prompt.txt', prompt)

      const zipBlob = await zip.generateAsync({ type: 'blob' })
      triggerDownload(zipBlob, `tbwc-poster-${monthSlug}-ai-kit.zip`)

      setStatus('done')
      setStatusMessage('Done — prompt copied')
      setTimeout(() => {
        setStatus('idle')
        setStatusMessage('')
      }, 3000)
    } catch (error) {
      console.error('Poster AI download failed:', error)
      setStatus('error')
      setStatusMessage('Download failed — try again')
      setTimeout(() => {
        setStatus('idle')
        setStatusMessage('')
      }, 4000)
    }
  }, [anchorLabel, currentEvents, monthSlug, nextEvents, nextMonthLabel])

  const isWorking = status === 'working'
  const label =
    status === 'done'
      ? 'Done'
      : status === 'error'
        ? 'Failed'
        : 'Download for AI'

  return (
    <span className="poster-toolbar-ai-download">
      <button
        type="button"
        className="poster-toolbar-button poster-toolbar-button--secondary"
        onClick={handleDownload}
        disabled={isWorking}
        aria-busy={isWorking}
      >
        {label}
      </button>
      {statusMessage && (
        <span className="poster-toolbar-status" role="status">
          {statusMessage}
        </span>
      )}
    </span>
  )
}

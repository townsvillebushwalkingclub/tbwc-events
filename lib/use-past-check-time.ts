'use client'

import { useSyncExternalStore } from 'react'

const INTERVAL_MS = 60_000

function subscribe(onStoreChange: () => void): () => void {
  const id = setInterval(onStoreChange, INTERVAL_MS)
  return () => clearInterval(id)
}

function getClientSnapshot(): number {
  return Date.now()
}

/**
 * Current time for past/upcoming checks: server `referenceTime` during SSR,
 * then live client time (updated every minute).
 */
export function usePastCheckTime(referenceTime: string): Date {
  const serverMs = new Date(referenceTime).getTime()
  const ms = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    () => serverMs
  )
  return new Date(ms)
}

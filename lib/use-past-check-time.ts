'use client'

import { useCallback, useRef, useSyncExternalStore } from 'react'

const INTERVAL_MS = 60_000

/**
 * Current time for past/upcoming checks: server `referenceTime` during SSR,
 * then live client time (updated every minute).
 *
 * Snapshot values are cached so useSyncExternalStore does not see a new
 * value on every read (which would crash hydration).
 */
export function usePastCheckTime(referenceTime: string): Date {
  const serverMs = new Date(referenceTime).getTime()
  const clientMsRef = useRef<number | null>(null)

  const subscribe = useCallback((onStoreChange: () => void) => {
    clientMsRef.current = Date.now()
    onStoreChange()
    const id = setInterval(() => {
      clientMsRef.current = Date.now()
      onStoreChange()
    }, INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  const getSnapshot = useCallback(() => {
    return clientMsRef.current ?? serverMs
  }, [serverMs])

  const getServerSnapshot = useCallback(() => serverMs, [serverMs])

  const ms = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  return new Date(ms)
}

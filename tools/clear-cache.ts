/**
 * Clear Facebook event caches on a running TBWC Events site.
 *
 * Usage:
 *   npm run cache:clear
 *   npm run cache:clear -- 1234567890123456
 *   npm run cache:clear -- --url https://events.townsvillebushwalkingclub.com
 */

const DEFAULT_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.SITE_URL ??
  'http://localhost:3000'

function readArg(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  if (index === -1) return undefined
  return process.argv[index + 1]
}

function readEventId(): string | undefined {
  const explicit = readArg('--event')
  if (explicit) return explicit
  const positional = process.argv[2]
  if (!positional || positional.startsWith('--')) return undefined
  return positional
}

async function main(): Promise<void> {
  const secret = process.env.CACHE_CLEAR_SECRET?.trim()
  if (!secret && process.env.NODE_ENV === 'production') {
    console.error('CACHE_CLEAR_SECRET is required in production.')
    process.exit(1)
  }

  const baseUrl = (readArg('--url') ?? DEFAULT_SITE_URL).replace(/\/$/, '')
  const eventId = readEventId()
  const body: Record<string, string> = {}
  if (eventId) body.eventId = eventId

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (secret) {
    headers.Authorization = `Bearer ${secret}`
  }

  const response = await fetch(`${baseUrl}/api/cache/clear`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  const payload = (await response.json().catch(() => null)) as
    | { success?: boolean; error?: string; cleared?: string[]; message?: string }
    | null

  if (!response.ok || !payload?.success) {
    console.error(
      `Cache clear failed (${response.status}): ${payload?.error ?? 'Unknown error'}`
    )
    process.exit(1)
  }

  console.log(payload.message ?? 'Cache cleared')
  if (eventId) {
    console.log(`Event ID: ${eventId}`)
  }
  console.log(`Site: ${baseUrl}`)
  if (payload.cleared?.length) {
    console.log(`Revalidated ${payload.cleared.length} cache target(s)`)
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})

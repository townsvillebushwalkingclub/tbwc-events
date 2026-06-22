import { EVENTS_SITE_ORIGIN } from './site'

export const OUTBOUND_REF = new URL(EVENTS_SITE_ORIGIN).hostname

export function tagOutboundRef(href: string): string {
  try {
    const url = new URL(href)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return href
    }
    if (url.hostname.toLowerCase() === OUTBOUND_REF) {
      return href
    }
    if (url.searchParams.has('ref')) {
      return href
    }
    url.searchParams.set('ref', OUTBOUND_REF)
    return url.toString()
  } catch {
    return href
  }
}

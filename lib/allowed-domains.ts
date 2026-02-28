/**
 * Allowed domains for hyperlinks in event descriptions
 */
export const ALLOWED_DOMAINS: string[] = [
  'townsvillebushwalkingclub.com',
  'townsvillebushwalkingclub.com.au',
  'wanderstories.space',
  'paluma.org',
  'facebook.com',
  'instagram.com',
  'parks.desi.qld.gov.au',
  'townsvillenorthqueensland.com.au',
  'townsville.qld.gov.au',
  'charterstowers.qld.gov.au',
  'visitcharterstowers.com.au',
  'hinchinbrookway.com.au',
  'queensland.com',
  'bit.ly',
  'forms.gle',
]

export function isAllowedDomain(hostname: string): boolean {
  const normalizedHostname = hostname.toLowerCase()
  return ALLOWED_DOMAINS.some(
    (domain) =>
      normalizedHostname === domain || normalizedHostname.endsWith('.' + domain)
  )
}

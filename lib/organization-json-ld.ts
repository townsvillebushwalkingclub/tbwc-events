import { EVENTS_SITE_ORIGIN } from '@/lib/site'

export const TBWC_ORG_URL = 'https://townsvillebushwalkingclub.com/'
export const TBWC_ORG_ID = `${TBWC_ORG_URL}#organization`

export type OrganizationJsonLd = {
  '@type': 'SportsOrganization'
  '@id': typeof TBWC_ORG_ID
  name: string
  alternateName: string
  url: string
  foundingDate: string
  email: string
  logo: string
  areaServed: {
    '@type': 'Place'
    name: string
  }
  address: {
    '@type': 'PostalAddress'
    name: string
    streetAddress: string
    addressLocality: string
    addressRegion: string
    postalCode: string
    addressCountry: string
  }
  memberOf: Array<{
    '@type': 'Organization'
    name: string
    url: string
  }>
  sameAs: string[]
}

/** Build schema.org SportsOrganization JSON-LD for Townsville Bushwalking Club. */
export function buildOrganizationJsonLd(): OrganizationJsonLd {
  return {
    '@type': 'SportsOrganization',
    '@id': TBWC_ORG_ID,
    name: 'Townsville Bushwalking Club',
    alternateName: 'TBWC',
    url: TBWC_ORG_URL,
    foundingDate: '1960-05',
    email: 'info@townsvillebushwalkingclub.com',
    logo: `${EVENTS_SITE_ORIGIN}/townsville-bushwalking-club-logo.png`,
    areaServed: {
      '@type': 'Place',
      name: 'Townsville and North Queensland, Australia',
    },
    address: {
      '@type': 'PostalAddress',
      name: 'Clubhouse',
      streetAddress:
        'Blessed Mary Mackillop Parish meeting room, 43 Ross River Road',
      addressLocality: 'Mundingburra',
      addressRegion: 'QLD',
      postalCode: '4812',
      addressCountry: 'AU',
    },
    memberOf: [
      {
        '@type': 'Organization',
        name: 'Bushwalking Queensland',
        url: 'https://www.bushwalkingqueensland.org.au/',
      },
      {
        '@type': 'Organization',
        name: 'Bushwalking Australia',
        url: 'https://bushwalkingaustralia.org/',
      },
    ],
    sameAs: [
      'https://www.facebook.com/townsvillebushwalkingclub/',
      'https://instagram.com/townsvillebushwalkingclub/',
    ],
  }
}

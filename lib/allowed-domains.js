/**
 * Allowed domains for hyperlinks in event descriptions
 * Used by both the embed script and homepage component
 */
export const ALLOWED_DOMAINS = [
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

/**
 * Check if a hostname is in the allowed domains list
 * @param {string} hostname - The hostname to check
 * @returns {boolean} - True if the hostname is allowed
 */
export function isAllowedDomain(hostname) {
    const normalizedHostname = hostname.toLowerCase()
    return ALLOWED_DOMAINS.some(
        (domain) =>
            normalizedHostname === domain ||
            normalizedHostname.endsWith('.' + domain)
    )
}

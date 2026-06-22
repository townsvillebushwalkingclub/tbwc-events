import { isAllowedDomain } from './allowed-domains'
import { tagOutboundRef } from './outbound-ref'

const BRISBANE_TIMEZONE = 'Australia/Brisbane'

/** Australian mobile: 04XX XXX XXX, 04XXXXXXXX, +61 4XX XXX XXX, etc. */
const AU_MOBILE_PATTERN =
  /(?<![\d+])(?:\+61[\s.-]?4(?:[\s.-]?\d){8}|0?4(?:[\s.-]?\d){2}(?:[\s.-]?\d){3}(?:[\s.-]?\d){3}|0?4\d{8})(?![\d])/g

function toTelHref(phone: string): string {
  const compact = phone.replace(/[\s.-]/g, '')
  if (compact.startsWith('+61')) {
    return 'tel:' + compact
  }
  if (compact.startsWith('61') && compact.length === 11) {
    return 'tel:+' + compact
  }
  if (compact.startsWith('0')) {
    return 'tel:' + compact
  }
  if (compact.startsWith('4') && compact.length === 9) {
    return 'tel:0' + compact
  }
  return 'tel:' + compact
}

function linkifyAustralianMobileNumbers(text: string): string {
  return text.replace(AU_MOBILE_PATTERN, (match) => {
    const href = toTelHref(match)
    return (
      '<a href="' +
      href +
      '" class="text-blue-600 hover:text-blue-800 underline break-all">' +
      match +
      '</a>'
    )
  })
}

/**
 * Normalize newlines for consistent spacing
 */
export function normalizeNewlines(text: string): string {
  if (!text) return ''
  return text.replace(/\n\s*\n+/g, '\n\n').replace(/\r\n/g, '\n')
}

function formatMailtoDatePart(startTime?: string | null): string | null {
  if (!startTime) return null
  try {
    const date = new Date(startTime)
    if (isNaN(date.getTime())) return null
    return date.toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'long',
      timeZone: BRISBANE_TIMEZONE,
    })
  } catch {
    return null
  }
}

export function buildMailtoSubject(
  eventTitle: string,
  startTime?: string | null
): string {
  if (!eventTitle) return ''
  const datePart = formatMailtoDatePart(startTime)
  if (datePart) {
    return `Re: ${datePart} - ${eventTitle}`
  }
  return `Re: ${eventTitle}`
}

/**
 * Process description to add hyperlinks for emails, phone numbers, and URLs
 */
export function processDescription(
  description: string,
  eventTitle: string,
  startTime?: string | null,
  normalizeFirst = true
): string {
  if (!description) return ''

  let processed = normalizeFirst ? normalizeNewlines(description) : description

  processed = processed
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

  processed = processed.replace(
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    function (match) {
      const subjectText = buildMailtoSubject(eventTitle, startTime)
      const subject = subjectText
        ? encodeURIComponent(subjectText)
        : ''
      const mailtoLink = subject
        ? 'mailto:' + match + '?subject=' + subject
        : 'mailto:' + match
      return (
        '<a href="' +
        mailtoLink +
        '" class="text-blue-600 hover:text-blue-800 underline break-all">' +
        match +
        '</a>'
      )
    }
  )

  processed = linkifyAustralianMobileNumbers(processed)

  processed = processed.replace(
    /\(([A-Za-z0-9][A-Za-z0-9.-]*\.[A-Z|a-z]{2,})\)/g,
    function (match, domain: string) {
      try {
        const normalizedDomain = domain.toLowerCase().replace(/^www\./, '')
        const fullDomain = domain.toLowerCase()
        if (isAllowedDomain(fullDomain)) {
          const url = tagOutboundRef('https://' + fullDomain)
          return (
            '(<a href="' +
            url +
            '" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline break-all">' +
            domain +
            '</a>)'
          )
        }
        return match
      } catch {
        return match
      }
    }
  )

  processed = processed.replace(/(https?:\/\/[^\s]+)/g, function (match) {
    try {
      const url = new URL(match)
      const hostname = url.hostname
      if (isAllowedDomain(hostname)) {
        const tagged = tagOutboundRef(match)
        return (
          '<a href="' +
          tagged +
          '" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline break-all">' +
          match +
          '</a>'
        )
      }
      return match
    } catch {
      return match
    }
  })

  processed = processed.replace(/\n\s*\n+/g, '<br><br>')
  processed = processed.replace(/\n/g, '<br>')
  return processed
}

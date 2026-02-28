import { isAllowedDomain } from './allowed-domains'

/**
 * Normalize newlines for consistent spacing
 */
export function normalizeNewlines(text: string): string {
  if (!text) return ''
  return text.replace(/\n\s*\n+/g, '\n\n').replace(/\r\n/g, '\n')
}

/**
 * Process description to add hyperlinks for emails and URLs
 */
export function processDescription(
  description: string,
  eventTitle: string,
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
      const subject = eventTitle
        ? encodeURIComponent('Re: ' + eventTitle)
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

  processed = processed.replace(
    /\(([A-Za-z0-9][A-Za-z0-9.-]*\.[A-Z|a-z]{2,})\)/g,
    function (match, domain: string) {
      try {
        const normalizedDomain = domain.toLowerCase().replace(/^www\./, '')
        const fullDomain = domain.toLowerCase()
        if (isAllowedDomain(fullDomain)) {
          const url = 'https://' + fullDomain
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
        return (
          '<a href="' +
          match +
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

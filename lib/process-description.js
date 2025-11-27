import { isAllowedDomain } from './allowed-domains'

/**
 * Normalize newlines for consistent spacing
 * @param {string} text - Text to normalize
 * @returns {string} Normalized text
 */
export function normalizeNewlines(text) {
    if (!text) return ''
    // Normalize multiple consecutive newlines to double newline (paragraph break)
    // This ensures consistent spacing between truncated and full descriptions
    return text.replace(/\n\s*\n+/g, '\n\n').replace(/\r\n/g, '\n')
}

/**
 * Process description to add hyperlinks for emails and URLs
 * Used by homepage EventsList, event detail page, and embed script
 * 
 * @param {string} description - The event description text
 * @param {string} eventTitle - The event title (used for email subject)
 * @param {boolean} normalizeFirst - Whether to normalize newlines first (default: true)
 * @returns {string} Processed HTML string with hyperlinks
 */
export function processDescription(description, eventTitle, normalizeFirst = true) {
    if (!description) return ''

    // Normalize newlines first for consistent spacing (if requested)
    let processed = normalizeFirst ? normalizeNewlines(description) : description

    // First, escape any existing HTML to prevent conflicts
    processed = processed
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')

    // Convert emails to mailto: links with event title as subject
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

    // Convert URLs to clickable links (only from allowed domains)
    processed = processed.replace(/(https?:\/\/[^\s]+)/g, function (match) {
        try {
            const url = new URL(match)
            const hostname = url.hostname

            // Check if the hostname is in the allowed domains list
            if (isAllowedDomain(hostname)) {
                return (
                    '<a href="' +
                    match +
                    '" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline break-all">' +
                    match +
                    '</a>'
                )
            } else {
                // Return the URL as plain text if not allowed
                return match
            }
        } catch (e) {
            // If URL parsing fails, return as plain text
            return match
        }
    })

    // Convert newlines to <br> tags for proper display
    // First handle paragraph breaks (double or more newlines) as double <br>
    processed = processed.replace(/\n\s*\n+/g, '<br><br>')
    // Then convert remaining single newlines to single <br>
    processed = processed.replace(/\n/g, '<br>')

    return processed
}


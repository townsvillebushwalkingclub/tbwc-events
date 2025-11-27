/**
 * Utility functions for event-related operations
 */

/**
 * Get Facebook event URL for an event ID
 * @param {string} eventId - The Facebook event ID
 * @returns {string} Facebook event URL
 */
export function getFacebookEventUrl(eventId) {
    return `https://www.facebook.com/events/${eventId}/`
}

/**
 * Calculate month label for an event (e.g., "Next Month", "Month After Next")
 * @param {Date|string} eventDate - The event start date
 * @param {Date|string} currentDate - The current date to compare against
 * @returns {string|null} Month label or null if not applicable
 */
export function getMonthLabel(eventDate, currentDate = new Date()) {
    const event = new Date(eventDate)
    const current = new Date(currentDate)
    
    const currentMonth = current.getMonth()
    const eventMonth = event.getMonth()
    const currentYear = current.getFullYear()
    const eventYear = event.getFullYear()
    
    // Calculate month difference
    const monthDiff = (eventYear - currentYear) * 12 + (eventMonth - currentMonth)
    
    if (monthDiff === 1) {
        return 'Next Month'
    } else if (monthDiff === 2) {
        return 'Month After Next'
    }
    
    return null
}

/**
 * Check if an event is a multi-day event
 * @param {Object} event - Event object with formatted_date and formatted_end_date
 * @returns {boolean} True if event spans multiple days
 */
export function isMultiDayEvent(event) {
    return !!(
        event.formatted_end_date &&
        event.formatted_end_date !== event.formatted_date
    )
}

/**
 * Format event date/time for display
 * Returns formatted strings for different display contexts
 * @param {Object} event - Event object with formatted_date, formatted_time, etc.
 * @returns {Object} Object with display strings
 */
export function formatEventDateTime(event) {
    const isMultiDay = isMultiDayEvent(event)
    
    if (isMultiDay) {
        return {
            isMultiDay: true,
            start: `${event.formatted_date} ${event.formatted_time}`,
            end: `${event.formatted_end_date} ${event.formatted_end_time || event.formatted_time}`,
            display: `${event.formatted_date} ${event.formatted_time} to ${event.formatted_end_date} ${event.formatted_end_time || event.formatted_time}`,
        }
    } else {
        return {
            isMultiDay: false,
            date: event.formatted_date,
            time: event.formatted_time,
            timeRange: event.formatted_end_time 
                ? `${event.formatted_time} - ${event.formatted_end_time}`
                : event.formatted_time,
            display: event.formatted_end_time
                ? `${event.formatted_date} ${event.formatted_time} - ${event.formatted_end_time}`
                : `${event.formatted_date} ${event.formatted_time}`,
        }
    }
}


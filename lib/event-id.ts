/**
 * Facebook event IDs are numeric and currently observed in the 15-17 digit range.
 * Allow up to 20 digits to stay compatible with potential future growth.
 */
export const FACEBOOK_EVENT_ID_REGEX = /^\d{15,20}$/

export function isValidFacebookEventId(value: string): boolean {
  return FACEBOOK_EVENT_ID_REGEX.test(value)
}

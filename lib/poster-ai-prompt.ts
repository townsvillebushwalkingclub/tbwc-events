/**
 * AI image-generation prompt builder for the TBWC events poster.
 */

import { POSTER_LOGO_FILENAME, POSTER_QR_URL } from '@/lib/poster-constants'

export interface PosterAiDownloadEvent {
  id: string
  name: string
  coverUrl: string | null
  dateLine: string
  description?: string
}

export interface PosterAiPromptInput {
  anchorLabel: string
  currentEvents: PosterAiDownloadEvent[]
  nextEvents: { name: string; dateLine: string }[]
  nextMonthLabel: string
}

function slugifyEventName(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

function coverExtension(coverUrl: string): string {
  const match = coverUrl.match(/\.(jpe?g|png|webp)$/i)
  return match ? match[1].toLowerCase().replace('jpeg', 'jpg') : 'jpg'
}

/** ZIP filename for an event cover, e.g. `01-mount-stuart.jpg`. */
export function posterCoverFilename(
  index: number,
  event: Pick<PosterAiDownloadEvent, 'name' | 'coverUrl'>
): string | null {
  if (!event.coverUrl) return null
  const num = String(index + 1).padStart(2, '0')
  const slug = slugifyEventName(event.name) || 'event'
  return `${num}-${slug}.${coverExtension(event.coverUrl)}`
}

function monthNameFromLabel(anchorLabel: string): string {
  return anchorLabel.replace(/\s+\d{4}$/, '').trim() || anchorLabel
}

function photoNote(event: PosterAiDownloadEvent, index: number): string {
  const filename = posterCoverFilename(index, event)
  return filename
    ? `Photo: use attached file "${filename}" exactly.`
    : 'Photo: no image provided — use a tasteful outdoor/hiking placeholder.'
}

function featuredEventBlock(event: PosterAiDownloadEvent, index: number): string {
  return `FEATURED EVENT (large hero banner below header):
- "${event.name}"
- Date/time: ${event.dateLine}
- ${photoNote(event, index)}
- Wide landscape photo with rounded corners
- Dark semi-transparent overlay strip at bottom-left of photo containing event title in bold white text
- Small orange calendar icon beside the date/time in white beneath the title
- Circular orange badge with a white hiker icon overlapping the bottom-right corner of the photo`
}

function gridEventBlock(
  event: PosterAiDownloadEvent,
  index: number,
  number: number
): string {
  return `${number}. "${event.name}"
   Date/time: ${event.dateLine}
   ${photoNote(event, index)}
   Card style: rounded photo on top; below photo include a small coloured circular activity icon (hiker, mountain, location pin, or wave — vary per card), event title in dark text, orange calendar icon + date/time line`
}

function layoutInstructions(
  anchorLabel: string,
  eventCount: number
): string {
  const month = monthNameFromLabel(anchorLabel)

  if (eventCount === 0) {
    return `MAIN BODY: Friendly empty-state message — "No upcoming events scheduled this month" — centred on the cream background with subtle nature illustration.`
  }

  if (eventCount === 1) {
    return `MAIN BODY:
- Single large featured hero event card only (full width below header)
- No grid section needed`
  }

  const gridCount = eventCount - 1
  const columns = gridCount <= 4 ? 2 : gridCount <= 9 ? 2 : 3

  return `MAIN BODY (top to bottom):

1. FEATURED HERO — first event only
   Full-width landscape photo banner immediately below the header (see featured event details below).

2. SECTION DIVIDER — centred heading between thin orange horizontal rules:
   "More ${month} Walks & Events"
   Small mountain/hiker icon centred above or beside the heading; heading text in burnt orange.

3. EVENT GRID — remaining ${gridCount} event(s) in a ${columns}-column grid
   Uniform smaller cards with rounded corners and subtle drop shadows.
   Each card: cover photo, small coloured circular activity icon, title, orange calendar icon + date.`
}

function eventSections(events: PosterAiDownloadEvent[]): string {
  if (events.length === 0) return '(No events this month.)'

  const sections: string[] = []

  sections.push(featuredEventBlock(events[0], 0))

  if (events.length > 1) {
    sections.push(
      `\nGRID EVENTS (${events.length - 1} card(s)):`
    )
    events.slice(1).forEach((event, i) => {
      sections.push(gridEventBlock(event, i + 1, i + 1))
    })
  }

  return sections.join('\n\n')
}

export function buildPosterAiPrompt(input: PosterAiPromptInput): string {
  const { anchorLabel, currentEvents, nextEvents, nextMonthLabel } = input
  const month = monthNameFromLabel(anchorLabel)
  const calendarUrl = POSTER_QR_URL.replace(/^https?:\/\//, '')

  const nextMonthSection =
    nextEvents.length > 0
      ? `\nNEXT MONTH BAR (above footer):
- Horizontal strip with light peach/orange background (#fde8dc or similar)
- Left: large orange calendar icon + bold text "NEXT: ${nextMonthLabel}"
- Centre/right: simple bullet list of upcoming events:
${nextEvents.map((e) => `  • ${e.dateLine}`).join('\n')}
- Right side: subtle stylised mountain-range silhouette in slightly darker orange as decorative background`
      : ''

  const coverList = currentEvents
    .map((event, index) => posterCoverFilename(index, event))
    .filter(Boolean)

  const attachmentsNote = `\nATTACHED ASSETS:
- Club logo: "${POSTER_LOGO_FILENAME}" — use in the top-left header beside the club name.
${
  coverList.length > 0
    ? `- Cover photos (${coverList.length} file(s)) — use each exactly for its matching event:\n${coverList.map((f) => `  - ${f}`).join('\n')}`
    : '- No cover photos attached — use appropriate outdoor/hiking placeholder images.'
}`

  return `Create a polished, print-ready A4 portrait events poster (210 × 297 mm) for the Townsville Bushwalking Club. Match the visual style of a modern outdoor club events flyer: warm, earthy, magazine-quality, with rounded corners throughout and generous white space.

OVERALL LOOK & FEEL:
- Background: off-white / warm cream (#faf8f5), not pure white
- Primary accent: burnt orange (#e85d3a to #d94e2b)
- Typography: clean modern sans-serif; titles bold, taglines light italic grey
- All photos and containers have rounded corners (8–12px radius)
- Subtle drop shadows on event cards
- Decorative touches: small stylised leafy branch illustrations in top-right and bottom-left corners; abstract wavy orange shape along the very top edge
- Professional print quality; cohesive outdoorsy aesthetic

HEADER (top of poster):
- Top-left: club logo ("${POSTER_LOGO_FILENAME}") beside "Townsville Bushwalking Club" in bold burnt orange
- Below club name: tagline "Walks, adventures & social events" in light grey italic
- Top-right: rounded pill badge in orange with small mountain icon + "${anchorLabel}" in white text
- Header sits on the cream background (not a full-width orange bar)

${layoutInstructions(anchorLabel, currentEvents.length)}

${nextMonthSection}

FOOTER (solid burnt-orange bar, full width):
- Left: white globe icon + "Full details & RSVP" in white bold text, with URL "${calendarUrl}" below in white
- Right: large high-contrast white QR code placeholder + handwritten-style white "Scan me!" text with a small arrow pointing at the QR code
${attachmentsNote}

EVENT DETAILS FOR ${anchorLabel.toUpperCase()} (${currentEvents.length} event(s)):
${eventSections(currentEvents)}

Generate ONE cohesive poster design. Use the attached logo and cover photos exactly where specified. Keep all text sharp and legible at print size. Do not add events, dates, or text beyond what is listed above.`
}

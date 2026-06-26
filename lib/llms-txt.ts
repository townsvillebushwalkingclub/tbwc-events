import { isEventPastOnCalendar } from '@/lib/event-utils'
import { getFacebookEvents } from '@/lib/facebook-api'
import { TBWC_ORG_URL } from '@/lib/organization-json-ld'
import { absoluteEventPageUrl, EVENTS_SITE_ORIGIN } from '@/lib/site'
import type { TBWCEvent } from '@/types/event'

const GRADE_PATTERN = /^\s*Grade\s*:\s*(.+)$/im

const CLUB_EMAIL = 'info@townsvillebushwalkingclub.com'

const SAFETY_LINKS = {
  walkerGuidelines: `${TBWC_ORG_URL}walker-guidelines/`,
  walkTogether: `${TBWC_ORG_URL}walk-together/`,
  whatToBring: `${TBWC_ORG_URL}what-to-bring/`,
  walkGrading: `${TBWC_ORG_URL}club-walk-grading-system/`,
} as const

/** Fetch non-past, non-cancelled events sorted by start time. */
export async function getUpcomingEvents(): Promise<TBWCEvent[]> {
  const events = await getFacebookEvents()
  return events
    .filter(
      (e) => e.start_time && !e.is_cancelled && !isEventPastOnCalendar(e)
    )
    .sort(
      (a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    )
}

export function extractEventGrade(description: string): string | null {
  if (!description) return null
  const match = description.match(GRADE_PATTERN)
  if (!match) return null
  const grade = match[1].trim()
  return grade.length > 0 ? grade : null
}

function formatEventLinkNotes(event: TBWCEvent): string {
  const parts: string[] = [event.formatted_date]
  const grade = extractEventGrade(event.description)
  if (grade) {
    parts.push(`Grade: ${grade}`)
  } else {
    parts.push('Grade: Not specified')
  }
  return parts.join(', ')
}

function buildOptionalInformationSection(): string {
  const org = TBWC_ORG_URL.replace(/\/$/, '')
  return [
    '### Mission',
    '',
    'Townsville Bushwalking Club (TBWC) has been organising guided bushwalks, hikes, and outdoor adventures in Townsville and North Queensland since 1960. We welcome members and visitors to explore national parks, coastal tracks, and hinterland country with experienced trip leaders.',
    '',
    `Main club website: ${org}`,
    '',
    '### Safety',
    '',
    'All participants must follow club walker guidelines and come prepared for Queensland conditions. Key resources:',
    '',
    `- [Walker guidelines](${SAFETY_LINKS.walkerGuidelines})`,
    `- [Walk together](${SAFETY_LINKS.walkTogether})`,
    `- [What to bring](${SAFETY_LINKS.whatToBring})`,
    '',
    '### Walk grading',
    '',
    'Event grades in the Upcoming Events section use the TBWC 4-part code (duration, terrain, fitness, plus optional modifiers such as W for wet travel). For example, M56W means medium duration, difficult terrain, hard fitness, with wet travel.',
    '',
    `- [Walk grading system](${SAFETY_LINKS.walkGrading})`,
    '',
    'RSVP directly with the trip leader listed on each event. Selecting "Going" on Facebook does not register you for a walk. Contacting the leader is required for club insurance due diligence.',
    '',
    '### Membership',
    '',
    `- TBWC members: walks are free.`,
    `- Visitors: $5 per walk.`,
    `- After three club walks, visitors are welcome to join as a member.`,
    `- Enquiries: ${CLUB_EMAIL}`,
    `- Clubhouse: Blessed Mary Mackillop Parish meeting room, 43 Ross River Road, Mundingburra QLD 4812`,
    '',
    `Events calendar: ${EVENTS_SITE_ORIGIN}/`,
  ].join('\n')
}

export function buildLlmsTxt(events: TBWCEvent[]): string {
  const lines: string[] = [
    '# Townsville Bushwalking Club',
    '',
    '> Official events calendar for guided bushwalks, hikes, and outdoor adventures in Townsville and North Queensland, Australia.',
    '',
    '## Optional Information',
    '',
    buildOptionalInformationSection(),
    '',
    '## Upcoming Events',
    '',
  ]

  if (events.length === 0) {
    lines.push('- No upcoming events are currently scheduled.')
  } else {
    for (const event of events) {
      const url = absoluteEventPageUrl(event.id)
      const notes = formatEventLinkNotes(event)
      lines.push(`- [${event.name}](${url}): ${notes}`)
    }
  }

  lines.push('')
  return lines.join('\n')
}

export async function generateLlmsTxt(): Promise<string> {
  const events = await getUpcomingEvents()
  return buildLlmsTxt(events)
}

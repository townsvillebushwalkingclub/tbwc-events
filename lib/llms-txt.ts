import {
  BRISBANE_TIMEZONE,
  isEventPastOnCalendar,
  normalizeFacebookIso,
} from '@/lib/event-utils'
import { getFacebookEvents } from '@/lib/facebook-api'
import { TBWC_ORG_URL } from '@/lib/organization-json-ld'
import { absoluteEventPageUrl, EVENTS_SITE_ORIGIN } from '@/lib/site'
import type { TBWCEvent } from '@/types/event'

const GRADE_PATTERN = /^\s*Grade\s*:\s*(.+)$/im

/** Brisbane has no DST; fixed offset for ISO 8601 timestamps in this file. */
const BRISBANE_OFFSET = '+10:00'

const CLUB_EMAIL = 'info@townsvillebushwalkingclub.com'

const CLUB_LINKS = {
  home: TBWC_ORG_URL.replace(/\/$/, ''),
  about: `${TBWC_ORG_URL}about/`,
  contact: `${TBWC_ORG_URL}contact/`,
  newMembers: `${TBWC_ORG_URL}new-members/`,
  walkerGuidelines: `${TBWC_ORG_URL}walker-guidelines/`,
  walkTogether: `${TBWC_ORG_URL}walk-together/`,
  whatToBring: `${TBWC_ORG_URL}what-to-bring/`,
  walkGrading: `${TBWC_ORG_URL}club-walk-grading-system/`,
  childProtection: `${TBWC_ORG_URL}child-protection-and-risk-management-policy/`,
  facebookPage: 'https://www.facebook.com/townsvillebushwalkingclub/',
  facebookGroup: 'https://www.facebook.com/groups/townsvillebushwalking',
  instagram: 'https://instagram.com/townsvillebushwalkingclub/',
  bushwalkingQueensland: 'https://www.bushwalkingqueensland.org.au/',
  bushwalkingAustralia: 'https://bushwalkingaustralia.org/',
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

/**
 * Format an instant as ISO 8601 in Australia/Brisbane (+10:00).
 * Used for the llms.txt generation stamp (AI freshness signal).
 */
export function formatBrisbaneIso(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-AU', {
    timeZone: BRISBANE_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}${BRISBANE_OFFSET}`
}

function formatEventLinkNotes(event: TBWCEvent): string {
  const parts: string[] = [`starts ${normalizeFacebookIso(event.start_time)}`]
  if (event.end_time) {
    parts.push(`ends ${normalizeFacebookIso(event.end_time)}`)
  }
  const grade = extractEventGrade(event.description)
  parts.push(grade ? `Grade: ${grade}` : 'Grade: Not specified')
  return parts.join(', ')
}

/** Free-form details after the summary blockquote (no headings; llmstxt.org). */
function buildDetailsSection(generatedAt: Date): string {
  return [
    `Last updated: ${formatBrisbaneIso(generatedAt)}`,
    '',
    'Townsville Bushwalking Club (TBWC) was formed in May 1960 and has organised guided outdoor adventures in Townsville and North Queensland since then (the club celebrated its 60th birthday in 2020). Activities are primarily bushwalking and hiking (both on and off track), along with canyoning, rock scrambling, bikepacking, and kayaking. Members and visitors explore national parks, coastal tracks, creeks, gorges, and hinterland country with experienced trip leaders.',
    '',
    'TBWC is affiliated with Bushwalking Queensland and Bushwalking Australia.',
    '',
    'Club walks and events are free for members and for non-members. Visitors may take part in up to three Club walks without becoming members; after the third walk, visitors must apply for membership. For permanent membership, new club members pay pro rata each month for their first membership year only, and this amount changes depending on the month they join. Otherwise, annual membership is $40 from July to June (1 July to 30 June). Later renewals are the full annual rate.',
    '',
    'How to attend a first walk:',
    '1. Read the Walker Guidelines and What to Bring pages linked below.',
    "2. Register (RSVP) by emailing the trip leader. The leader's contact details are in the walk description on the event page. Selecting \"Going\" on Facebook does not register you. Contacting the leader is required for club insurance due diligence.",
    '3. Confirm with the leader that the activity suits your experience and fitness, and ask before bringing a child.',
    '4. Arrive prepared for Queensland conditions.',
    '',
    'Event grades use the TBWC 4-part code (duration, terrain, fitness, plus optional modifiers such as W for wet travel). For example, M56W means medium duration, difficult terrain, hard fitness, with wet travel. See the Walk Grading System link below.',
    '',
    "Whether children can attend is up to the trip leader and depends on how difficult the event is (grade, terrain, and conditions), as well as the child's age, experience, and ability. Children older than 12 and under 18 should be accompanied by a parent or guardian unless the Club has approved other arrangements consistent with its current policies (see the child protection policy link below). Always contact the trip leader before attending with a child so they can decide whether the activity is appropriate.",
    '',
    `Enquiries: ${CLUB_EMAIL}`,
    'Clubhouse: Blessed Mary Mackillop Parish meeting room, 43 Ross River Road, Mundingburra QLD 4812',
  ].join('\n')
}

function buildGuidelinesSection(): string {
  return [
    '## Guidelines and policies',
    '',
    `- [Walker Guidelines](${CLUB_LINKS.walkerGuidelines}): Expected conduct and preparation before attending`,
    `- [Walk Together](${CLUB_LINKS.walkTogether}): How club walks are run as a group`,
    `- [What to Bring?](${CLUB_LINKS.whatToBring}): Gear and preparation for Queensland conditions`,
    `- [Walk Grading System](${CLUB_LINKS.walkGrading}): Duration, terrain, fitness, and modifiers (for example M56W)`,
    `- [Child protection and risk management policy](${CLUB_LINKS.childProtection}): Age limits and arrangements for children`,
  ].join('\n')
}

function buildClubInformationSection(): string {
  return [
    '## Club information',
    '',
    `- [Townsville Bushwalking Club website](${CLUB_LINKS.home}): Main club site with trip reports and news`,
    `- [About](${CLUB_LINKS.about}): Who the club is and what we do`,
    `- [New Members](${CLUB_LINKS.newMembers}): Visitor walks, membership, and pro-rata fees`,
    `- [Contact](${CLUB_LINKS.contact}): Get in touch with the club`,
    `- [Events calendar](${EVENTS_SITE_ORIGIN}/): This site - upcoming walks and outdoor activities`,
  ].join('\n')
}

function buildOptionalSection(): string {
  return [
    '## Optional',
    '',
    `- [Facebook page](${CLUB_LINKS.facebookPage}): Official Facebook page`,
    `- [Facebook group](${CLUB_LINKS.facebookGroup}): Member and visitor discussion group`,
    `- [Instagram](${CLUB_LINKS.instagram}): Photos and trip highlights`,
    `- [Bushwalking Queensland](${CLUB_LINKS.bushwalkingQueensland}): State peak body`,
    `- [Bushwalking Australia](${CLUB_LINKS.bushwalkingAustralia}): National peak body`,
  ].join('\n')
}

function buildUpcomingEventsSection(events: TBWCEvent[]): string {
  const lines: string[] = ['## Upcoming Events', '']
  if (events.length === 0) {
    lines.push('- No upcoming events are currently scheduled.')
  } else {
    for (const event of events) {
      const url = absoluteEventPageUrl(event.id)
      const notes = formatEventLinkNotes(event)
      lines.push(`- [${event.name}](${url}): ${notes}`)
    }
  }
  return lines.join('\n')
}

/**
 * Build llms.txt body (llmstxt.org): H1, summary blockquote, details
 * (including Last updated), then H2 link lists ending with Optional.
 * Event notes use ISO 8601 start/end times (Australia/Brisbane offsets).
 */
export function buildLlmsTxt(
  events: TBWCEvent[],
  generatedAt: Date = new Date()
): string {
  return [
    '# Townsville Bushwalking Club',
    '',
    '> Official events calendar for guided bushwalks, hikes, and outdoor adventures in Townsville and North Queensland, Australia. Primarily bushwalking and hiking (on and off track); also canyoning, rock scrambling, bikepacking, and kayaking.',
    '',
    buildDetailsSection(generatedAt),
    '',
    buildUpcomingEventsSection(events),
    '',
    buildGuidelinesSection(),
    '',
    buildClubInformationSection(),
    '',
    buildOptionalSection(),
    '',
  ].join('\n')
}

export async function generateLlmsTxt(): Promise<string> {
  const events = await getUpcomingEvents()
  return buildLlmsTxt(events)
}

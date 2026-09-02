/**
 * Client-safe helpers to pull leader names and RSVP emails from event descriptions.
 */

import { applyDescriptionCorrections, normalizeNewlines } from '@/lib/process-description'

const EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/gi
const LEADER_LINE_PATTERN = /^\s*Leaders?\s*:\s*(.+)$/gim

export interface PosterEventContact {
  leaders: string[]
  emails: string[]
}

function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const value of values) {
    const key = value.toLowerCase()
    if (!seen.has(key)) {
      seen.add(key)
      result.push(value)
    }
  }
  return result
}

export function extractEmailsFromText(text: string): string[] {
  if (!text) return []
  const matches = applyDescriptionCorrections(text).match(EMAIL_PATTERN) ?? []
  return uniqueStrings(matches.map((email) => email.toLowerCase()))
}

function stripEmailsFromText(text: string): string {
  return text.replace(EMAIL_PATTERN, '').replace(/\s+/g, ' ').trim()
}

function splitLeaderNames(raw: string): string[] {
  const cleaned = stripEmailsFromText(raw)
    .replace(/\([^)]*\)/g, '')
    .trim()
  if (!cleaned) return []

  return cleaned
    .split(/\s*,\s*|\s+and\s+|\s*&\s*/i)
    .map((name) => name.trim())
    .filter(
      (name) =>
        name.length > 0 &&
        !/^option\s+\d+$/i.test(name) &&
        !/^trip$/i.test(name)
    )
}

export function extractLeadersFromDescription(description: string): string[] {
  if (!description) return []
  const normalized = normalizeNewlines(description)
  const leaders: string[] = []

  let match: RegExpExecArray | null
  while ((match = LEADER_LINE_PATTERN.exec(normalized)) !== null) {
    leaders.push(...splitLeaderNames(match[1]))
  }

  if (leaders.length === 0) {
    const informal = normalized.match(
      /(?:walk|trip)\s+leader\s+([A-Za-z][A-Za-z' -]{0,40})/i
    )
    if (informal) {
      leaders.push(...splitLeaderNames(informal[1]))
    }
  }

  return uniqueStrings(leaders)
}

export function extractEmailsFromDescription(description: string): string[] {
  return extractEmailsFromText(description)
}

export function extractPosterEventContact(description: string): PosterEventContact {
  return {
    leaders: extractLeadersFromDescription(description),
    emails: extractEmailsFromDescription(description),
  }
}

/** Drop explicit Leader/RSVP lines so contact details are not repeated in the blurb. */
export function stripPosterContactLines(description: string): string {
  if (!description) return ''
  return normalizeNewlines(description)
    .split('\n')
    .filter((line) => {
      const trimmed = line.trim()
      if (/^Leaders?\s*:/i.test(trimmed)) return false
      if (/^RSVP\s*:/i.test(trimmed) && extractEmailsFromText(trimmed).length > 0) {
        return false
      }
      return true
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

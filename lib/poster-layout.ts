/**
 * A4 poster layout presets for 4–12 current-month events.
 * Each preset defines grid columns and typography; row heights flex to fill the sheet.
 */

export const A4_WIDTH_MM = 210
export const A4_HEIGHT_MM = 297
export const A4_PRINT_MARGIN_MM = 8

export type PosterLayoutCount = 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12

export interface PosterLayoutConfig {
  count: PosterLayoutCount
  columns: 2 | 3
  showDescription: boolean
}

const LAYOUTS: Record<PosterLayoutCount, PosterLayoutConfig> = {
  4: { count: 4, columns: 2, showDescription: true },
  5: { count: 5, columns: 2, showDescription: false },
  6: { count: 6, columns: 2, showDescription: false },
  7: { count: 7, columns: 3, showDescription: false },
  8: { count: 8, columns: 2, showDescription: false },
  9: { count: 9, columns: 3, showDescription: false },
  10: { count: 10, columns: 2, showDescription: false },
  11: { count: 11, columns: 3, showDescription: false },
  12: { count: 12, columns: 3, showDescription: false },
}

/** Resolve layout for the current month event count (clamped 4–12; sparse months use count 4). */
export function getPosterLayout(eventCount: number): PosterLayoutConfig {
  if (eventCount <= 0) return LAYOUTS[4]
  if (eventCount < 4) {
    return { count: 4, columns: eventCount <= 2 ? 2 : 2, showDescription: true }
  }
  if (eventCount > 12) return LAYOUTS[12]
  return LAYOUTS[eventCount as PosterLayoutCount]
}

export function posterLayoutClassName(eventCount: number): string {
  const layout = getPosterLayout(eventCount)
  return `poster-page--count-${layout.count} poster-page--cols-${layout.columns}`
}

export function posterGridClassName(columns: 2 | 3): string {
  return columns === 3
    ? 'poster-events-grid poster-events-grid--3'
    : 'poster-events-grid poster-events-grid--2'
}

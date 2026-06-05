/**
 * A4 poster layout presets for 4–12 current-month events.
 * Each preset defines grid columns and typography; row heights flex to fill the sheet.
 */

export const A4_WIDTH_MM = 210
export const A4_HEIGHT_MM = 297
export const A4_PRINT_MARGIN_MM = 8

export type PosterLayoutCount = 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12

export type PosterGridMode =
  | 'uniform'
  | 'featured-five'
  | 'featured-seven'
  | 'spread-last-two'

export interface PosterLayoutConfig {
  count: PosterLayoutCount
  columns: 2 | 3
  showDescription: boolean
  gridMode: PosterGridMode
}

const LAYOUTS: Record<PosterLayoutCount, PosterLayoutConfig> = {
  4: { count: 4, columns: 2, showDescription: true, gridMode: 'uniform' },
  5: { count: 5, columns: 2, showDescription: false, gridMode: 'featured-five' },
  6: { count: 6, columns: 2, showDescription: false, gridMode: 'uniform' },
  7: { count: 7, columns: 3, showDescription: false, gridMode: 'featured-seven' },
  8: { count: 8, columns: 2, showDescription: false, gridMode: 'uniform' },
  9: { count: 9, columns: 3, showDescription: false, gridMode: 'uniform' },
  10: { count: 10, columns: 2, showDescription: false, gridMode: 'uniform' },
  11: { count: 11, columns: 3, showDescription: false, gridMode: 'spread-last-two' },
  12: { count: 12, columns: 3, showDescription: false, gridMode: 'uniform' },
}

/** Resolve layout for the current month event count (clamped 4–12; sparse months use count 4). */
export function getPosterLayout(eventCount: number): PosterLayoutConfig {
  if (eventCount <= 0) return LAYOUTS[4]
  if (eventCount < 4) {
    return {
      count: 4,
      columns: 2,
      showDescription: true,
      gridMode: 'uniform',
    }
  }
  if (eventCount > 12) return LAYOUTS[12]
  return LAYOUTS[eventCount as PosterLayoutCount]
}

export function posterLayoutClassName(eventCount: number): string {
  const layout = getPosterLayout(eventCount)
  return `poster-page--count-${layout.count} poster-page--cols-${layout.columns}`
}

export function posterUsesFeaturedFirstEvent(layout: PosterLayoutConfig): boolean {
  return layout.gridMode === 'featured-five' || layout.gridMode === 'featured-seven'
}

export function posterGridClassName(layout: PosterLayoutConfig): string {
  if (layout.gridMode === 'featured-five') {
    return 'poster-events-grid poster-events-grid--featured-five'
  }
  if (layout.gridMode === 'featured-seven') {
    return 'poster-events-grid poster-events-grid--featured-seven'
  }
  if (layout.gridMode === 'spread-last-two') {
    return 'poster-events-grid poster-events-grid--spread-last-two'
  }
  return layout.columns === 3
    ? 'poster-events-grid poster-events-grid--3'
    : 'poster-events-grid poster-events-grid--2'
}

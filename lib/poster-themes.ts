export type PosterThemeId = 'simple' | 'nature'

export const POSTER_THEME_IDS: PosterThemeId[] = ['nature', 'simple']

export const POSTER_THEMES: Record<PosterThemeId, string> = {
  simple: 'Simple',
  nature: 'Nature',
}

export const POSTER_THEME_STORAGE_KEY = 'tbwc-poster-theme'

export const DEFAULT_POSTER_THEME: PosterThemeId = 'nature'

export function isPosterThemeId(value: string): value is PosterThemeId {
  return value === 'simple' || value === 'nature'
}

export function posterThemeClassName(theme: PosterThemeId): string {
  return `poster-page--theme-${theme}`
}

export function parsePosterThemeParam(
  value: string | string[] | undefined
): PosterThemeId | null {
  const raw = Array.isArray(value) ? value[0] : value
  return raw && isPosterThemeId(raw) ? raw : null
}

/** Append theme to an existing poster query string (`?exclude=…` or ``). */
export function appendPosterThemeToQuery(
  query: string,
  theme: PosterThemeId
): string {
  if (theme === DEFAULT_POSTER_THEME) return query
  const separator = query.includes('?') ? '&' : '?'
  return `${query}${separator}theme=${theme}`
}

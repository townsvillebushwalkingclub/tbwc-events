export type PosterThemeId = 'simple' | 'nature'

export const POSTER_THEME_IDS: PosterThemeId[] = ['simple', 'nature']

export const POSTER_THEMES: Record<PosterThemeId, string> = {
  simple: 'Simple',
  nature: 'Nature',
}

export const POSTER_THEME_STORAGE_KEY = 'tbwc-poster-theme'

export const DEFAULT_POSTER_THEME: PosterThemeId = 'simple'

export function isPosterThemeId(value: string): value is PosterThemeId {
  return value === 'simple' || value === 'nature'
}

export function posterThemeClassName(theme: PosterThemeId): string {
  return `poster-page--theme-${theme}`
}

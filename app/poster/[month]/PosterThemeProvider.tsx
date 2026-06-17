'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  DEFAULT_POSTER_THEME,
  isPosterThemeId,
  POSTER_THEME_STORAGE_KEY,
  type PosterThemeId,
} from '@/lib/poster-themes'

interface PosterThemeContextValue {
  theme: PosterThemeId
  setTheme: (theme: PosterThemeId) => void
}

const PosterThemeContext = createContext<PosterThemeContextValue | null>(null)

function readStoredTheme(): PosterThemeId {
  if (typeof window === 'undefined') return DEFAULT_POSTER_THEME
  const stored = localStorage.getItem(POSTER_THEME_STORAGE_KEY)
  return stored && isPosterThemeId(stored) ? stored : DEFAULT_POSTER_THEME
}

export function PosterThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<PosterThemeId>(DEFAULT_POSTER_THEME)

  useEffect(() => {
    setThemeState(readStoredTheme())
  }, [])

  const setTheme = useCallback((next: PosterThemeId) => {
    setThemeState(next)
    localStorage.setItem(POSTER_THEME_STORAGE_KEY, next)
  }, [])

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme])

  return (
    <PosterThemeContext.Provider value={value}>
      {children}
    </PosterThemeContext.Provider>
  )
}

export function usePosterTheme(): PosterThemeContextValue {
  const context = useContext(PosterThemeContext)
  if (!context) {
    throw new Error('usePosterTheme must be used within PosterThemeProvider')
  }
  return context
}

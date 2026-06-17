'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  DEFAULT_POSTER_THEME,
  isPosterThemeId,
  POSTER_THEME_STORAGE_KEY,
  POSTER_THEMES,
  type PosterThemeId,
} from '@/lib/poster-themes'

interface PosterThemeProviderProps {
  children: ReactNode
  /** Theme from `?theme=` (server-parsed) for correct first paint and print. */
  initialTheme?: PosterThemeId | null
}

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

function syncThemeToUrl(theme: PosterThemeId): void {
  const url = new URL(window.location.href)
  if (theme === DEFAULT_POSTER_THEME) {
    url.searchParams.delete('theme')
  } else {
    url.searchParams.set('theme', theme)
  }
  window.history.replaceState(null, '', url)
}

export function PosterThemeProvider({
  children,
  initialTheme = null,
}: PosterThemeProviderProps) {
  const [theme, setThemeState] = useState<PosterThemeId>(
    () => initialTheme ?? DEFAULT_POSTER_THEME
  )
  const savedTitleRef = useRef<string | null>(null)

  useEffect(() => {
    if (initialTheme) {
      localStorage.setItem(POSTER_THEME_STORAGE_KEY, initialTheme)
      return
    }
    const stored = readStoredTheme()
    setThemeState(stored)
    syncThemeToUrl(stored)
  }, [initialTheme])

  useEffect(() => {
    document.documentElement.dataset.posterTheme = theme
  }, [theme])

  useEffect(() => {
    const onBeforePrint = () => {
      savedTitleRef.current = document.title
      const themeLabel = POSTER_THEMES[theme]
      if (!document.title.includes(themeLabel)) {
        document.title = `${document.title} – ${themeLabel}`
      }
    }

    const onAfterPrint = () => {
      if (savedTitleRef.current !== null) {
        document.title = savedTitleRef.current
        savedTitleRef.current = null
      }
    }

    window.addEventListener('beforeprint', onBeforePrint)
    window.addEventListener('afterprint', onAfterPrint)
    return () => {
      window.removeEventListener('beforeprint', onBeforePrint)
      window.removeEventListener('afterprint', onAfterPrint)
    }
  }, [theme])

  const setTheme = useCallback((next: PosterThemeId) => {
    setThemeState(next)
    localStorage.setItem(POSTER_THEME_STORAGE_KEY, next)
    syncThemeToUrl(next)
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

import { useLayoutEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'theme-preference'

function getSystemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getStoredTheme(): Theme | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === 'light' || stored === 'dark' ? stored : null
  } catch {
    return null
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => getStoredTheme() ?? getSystemTheme())

  useLayoutEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const setTheme = (next: Theme) => {
    setThemeState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // localStorage may be unavailable; the theme still applies for this session.
    }
  }

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark')

  return { theme, toggleTheme }
}

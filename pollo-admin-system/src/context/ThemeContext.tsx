import * as React from 'react'

export type Theme = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'pollo-admin-theme'

function getStoredTheme(): Theme {
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return stored === 'light' || stored === 'dark' ? stored : 'system'
}

function resolveIsDark(theme: Theme): boolean {
  if (theme === 'system') return window.matchMedia('(prefers-color-scheme: dark)').matches
  return theme === 'dark'
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', resolveIsDark(theme))
}

interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
  isDark: boolean
}

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>(getStoredTheme)

  React.useEffect(() => {
    applyTheme(theme)
    if (theme === 'system') {
      const mql = window.matchMedia('(prefers-color-scheme: dark)')
      const onChange = () => applyTheme('system')
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    }
  }, [theme])

  const setTheme = React.useCallback((next: Theme) => {
    setThemeState(next)
    if (next === 'system') {
      window.localStorage.removeItem(STORAGE_KEY)
    } else {
      window.localStorage.setItem(STORAGE_KEY, next)
    }
  }, [])

  const value = React.useMemo<ThemeContextValue>(
    () => ({ theme, setTheme, isDark: resolveIsDark(theme) }),
    [theme, setTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = React.useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme debe usarse dentro de <ThemeProvider>')
  return ctx
}

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import type { ReactNode } from "react"
import { ScriptOnce } from "@tanstack/react-router"

import {
  INITIAL_THEME_SCRIPT,
  SYSTEM_THEME_QUERY,
  THEME_STORAGE_KEY,
  applyResolvedTheme,
  readStoredTheme,
  resolveTheme,
} from "./theme"
import type { Theme } from "./theme"

interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function applyTheme(theme: Theme) {
  const mediaQuery = window.matchMedia(SYSTEM_THEME_QUERY)
  applyResolvedTheme(
    document.documentElement,
    resolveTheme(theme, mediaQuery.matches)
  )
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // SSR and the first client render deliberately agree. The script already applies
  // the stored selection to the document before hydration; the provider then adopts
  // that stored state.
  const [theme, setThemeState] = useState<Theme>("system")
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    let storedTheme: Theme = "system"

    try {
      storedTheme = readStoredTheme(window.localStorage)
    } catch {
      // Blocked browser storage only affects persistence, not the current session.
    }

    setThemeState(storedTheme)
    applyTheme(storedTheme)
    setInitialized(true)
  }, [])

  useEffect(() => {
    if (!initialized || theme !== "system") return

    const mediaQuery = window.matchMedia(SYSTEM_THEME_QUERY)
    const handleChange = () => {
      applyResolvedTheme(
        document.documentElement,
        resolveTheme("system", mediaQuery.matches)
      )
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [initialized, theme])

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== null && event.key !== THEME_STORAGE_KEY) return

      let storedTheme: Theme = "system"
      try {
        storedTheme = readStoredTheme(window.localStorage)
      } catch {
        // If storage becomes unavailable, use the safe default again.
      }

      setThemeState(storedTheme)
      applyTheme(storedTheme)
    }

    window.addEventListener("storage", handleStorage)
    return () => window.removeEventListener("storage", handleStorage)
  }, [])

  const setTheme = useCallback((nextTheme: Theme) => {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
    } catch {
      // The current session can still change theme without persistent storage.
    }

    applyTheme(nextTheme)
    setThemeState(nextTheme)
  }, [])

  const value = useMemo(() => ({ theme, setTheme }), [setTheme, theme])

  return (
    <ThemeContext.Provider value={value}>
      <ScriptOnce>{INITIAL_THEME_SCRIPT}</ScriptOnce>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider")
  }
  return context
}

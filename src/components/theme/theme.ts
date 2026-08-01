export const THEME_STORAGE_KEY = "roundnet-theme"
export const SYSTEM_THEME_QUERY = "(prefers-color-scheme: dark)"

export const THEMES = ["system", "light", "dark"] as const

export type Theme = (typeof THEMES)[number]
export type ResolvedTheme = Exclude<Theme, "system">

export function isTheme(value: unknown): value is Theme {
  return typeof value === "string" && THEMES.some((theme) => theme === value)
}

export function resolveTheme(
  theme: Theme,
  prefersDark: boolean
): ResolvedTheme {
  if (theme === "system") return prefersDark ? "dark" : "light"
  return theme
}

export function readStoredTheme(storage: Pick<Storage, "getItem">): Theme {
  const storedTheme = storage.getItem(THEME_STORAGE_KEY)
  return isTheme(storedTheme) ? storedTheme : "system"
}

export function applyResolvedTheme(
  root: HTMLElement,
  resolvedTheme: ResolvedTheme
) {
  root.classList.remove("light", "dark")
  root.classList.add(resolvedTheme)
  root.style.colorScheme = resolvedTheme
}

/**
 * Runs as `ScriptOnce` before hydration. This function is deliberately self-contained
 * so its serialized form does not depend on imports or module-level variables.
 */
export function applyInitialTheme() {
  let storedTheme: string | null = null
  try {
    storedTheme = window.localStorage.getItem("roundnet-theme")
  } catch {
    // Blocked browser storage falls back to the `system` default.
  }

  const theme =
    storedTheme === "light" ||
    storedTheme === "dark" ||
    storedTheme === "system"
      ? storedTheme
      : "system"
  let prefersDark = false
  if (theme === "system") {
    try {
      prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    } catch {
      // Light remains the safe browser default without media query support.
    }
  }

  const resolvedTheme =
    theme === "system" ? (prefersDark ? "dark" : "light") : theme
  const root = document.documentElement

  root.classList.remove("light", "dark")
  root.classList.add(resolvedTheme)
  root.style.colorScheme = resolvedTheme
}

export const INITIAL_THEME_SCRIPT = `(${applyInitialTheme.toString()})()`

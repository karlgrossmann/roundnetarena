import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ThemeProvider, useTheme } from "./ThemeProvider"
import { AnonymousMenu } from "@/components/layout/AnonymousMenu"
import {
  SYSTEM_THEME_QUERY,
  THEME_STORAGE_KEY,
  applyInitialTheme,
} from "./theme"
import { overwriteGetLocale } from "@/paraglide/runtime.js"

vi.mock("@tanstack/react-router", () => ({
  ScriptOnce: () => null,
}))

function installMatchMedia(initialMatches: boolean) {
  let matches = initialMatches
  const listeners = new Set<() => void>()
  const mediaQuery = {
    get matches() {
      return matches
    },
    media: SYSTEM_THEME_QUERY,
    onchange: null,
    addEventListener: (_type: string, listener: () => void) => {
      listeners.add(listener)
    },
    removeEventListener: (_type: string, listener: () => void) => {
      listeners.delete(listener)
    },
    addListener: (listener: () => void) => {
      listeners.add(listener)
    },
    removeListener: (listener: () => void) => {
      listeners.delete(listener)
    },
    dispatchEvent: () => true,
  } as unknown as MediaQueryList

  window.matchMedia = vi.fn(() => mediaQuery)

  return {
    setMatches(nextMatches: boolean) {
      matches = nextMatches
      listeners.forEach((listener) => listener())
    },
  }
}

function installLocalStorage() {
  const values = new Map<string, string>()
  const storage: Storage = {
    get length() {
      return values.size
    },
    clear() {
      values.clear()
    },
    getItem(key) {
      return values.get(key) ?? null
    },
    key(index) {
      return [...values.keys()][index] ?? null
    },
    removeItem(key) {
      values.delete(key)
    },
    setItem(key, value) {
      values.set(key, value)
    },
  }

  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: storage,
  })
}

function ThemeProbe() {
  const { theme, setTheme } = useTheme()

  return (
    <>
      <output data-testid="theme">{theme}</output>
      <button type="button" onClick={() => setTheme("system")}>
        System
      </button>
      <button type="button" onClick={() => setTheme("light")}>
        Light
      </button>
      <button type="button" onClick={() => setTheme("dark")}>
        Dark
      </button>
    </>
  )
}

function renderProvider() {
  return render(
    <ThemeProvider>
      <ThemeProbe />
    </ThemeProvider>
  )
}

describe("ThemeProvider", () => {
  beforeEach(() => {
    installLocalStorage()
    document.documentElement.classList.remove("light", "dark")
    document.documentElement.style.colorScheme = ""
    overwriteGetLocale(() => "de")
  })

  it("uses system by default and falls back to system for unknown values", async () => {
    const media = installMatchMedia(false)
    const view = renderProvider()

    await waitFor(() => {
      expect(screen.getByTestId("theme").textContent).toBe("system")
      expect(document.documentElement.className).toBe("light")
      expect(document.documentElement.style.colorScheme).toBe("light")
    })

    view.unmount()
    window.localStorage.setItem(THEME_STORAGE_KEY, "sepia")
    act(() => media.setMatches(true))
    renderProvider()

    await waitFor(() => {
      expect(screen.getByTestId("theme").textContent).toBe("system")
      expect(document.documentElement.className).toBe("dark")
      expect(document.documentElement.style.colorScheme).toBe("dark")
    })
  })

  it("reacts to system changes only while system is selected", async () => {
    const media = installMatchMedia(false)
    renderProvider()

    await waitFor(() =>
      expect(document.documentElement.className).toBe("light")
    )

    act(() => media.setMatches(true))
    expect(document.documentElement.className).toBe("dark")

    fireEvent.click(screen.getByRole("button", { name: "Light" }))
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light")
    expect(document.documentElement.className).toBe("light")

    act(() => media.setMatches(false))
    act(() => media.setMatches(true))
    expect(document.documentElement.className).toBe("light")

    fireEvent.click(screen.getByRole("button", { name: "Dark" }))
    act(() => media.setMatches(false))
    expect(document.documentElement.className).toBe("dark")

    fireEvent.click(screen.getByRole("button", { name: "System" }))
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("system")
    expect(document.documentElement.className).toBe("light")

    act(() => media.setMatches(true))
    expect(document.documentElement.className).toBe("dark")
    expect(document.documentElement.classList.contains("light")).toBe(false)
  })

  it("restores a manual selection after remounting", async () => {
    installMatchMedia(false)
    const view = renderProvider()

    fireEvent.click(screen.getByRole("button", { name: "Dark" }))
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark")
    view.unmount()

    document.documentElement.classList.remove("light", "dark")
    renderProvider()

    await waitFor(() => {
      expect(screen.getByTestId("theme").textContent).toBe("dark")
      expect(document.documentElement.className).toBe("dark")
      expect(document.documentElement.style.colorScheme).toBe("dark")
    })
  })

  it("exposes localized, accessible menu choices", async () => {
    installMatchMedia(false)
    const view = render(
      <ThemeProvider>
        <AnonymousMenu />
      </ThemeProvider>
    )

    fireEvent.click(screen.getByRole("button", { name: "Menü" }))
    fireEvent.click(
      await screen.findByRole("menuitemradio", { name: "Dunkel" })
    )

    await waitFor(() => expect(document.documentElement.className).toBe("dark"))

    view.unmount()
    overwriteGetLocale(() => "en")
    render(
      <ThemeProvider>
        <AnonymousMenu />
      </ThemeProvider>
    )

    fireEvent.click(screen.getByRole("button", { name: "Menu" }))
    expect(
      await screen.findByRole("menuitemradio", { name: "Dark" })
    ).not.toBeNull()
  })
})

describe("applyInitialTheme", () => {
  beforeEach(() => {
    installLocalStorage()
    document.documentElement.classList.remove("light", "dark")
    document.documentElement.style.colorScheme = ""
  })

  it("applies the stored selection before hydration", () => {
    installMatchMedia(false)
    window.localStorage.setItem(THEME_STORAGE_KEY, "dark")
    document.documentElement.classList.add("light")

    applyInitialTheme()

    expect(document.documentElement.className).toBe("dark")
    expect(document.documentElement.style.colorScheme).toBe("dark")
  })

  it("resolves an unknown selection through the system preference", () => {
    installMatchMedia(true)
    window.localStorage.setItem(THEME_STORAGE_KEY, "unknown")

    applyInitialTheme()

    expect(document.documentElement.className).toBe("dark")
    expect(document.documentElement.style.colorScheme).toBe("dark")
  })
})

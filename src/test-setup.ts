import { cleanup } from "@testing-library/react"
import { afterEach, beforeEach } from "vitest"

/** Tests start with the German base locale, like the application. Individual locale
 *  tests pass their language explicitly or override the request. */
beforeEach(() => {
  if (typeof document !== "undefined") {
    document.cookie = "PARAGLIDE_LOCALE=de; path=/"
  }
})

/** Without `globals: true` Testing Library does not register its cleanup itself, and
 *  queries in the next test would still find the previous test's markup. */
afterEach(() => {
  cleanup()
})

/**
 * jsdom has no `matchMedia`, so anything width-dependent (`useIsMobile`, and with it
 * `ResponsivePanel`) would crash on mount.
 *
 * The answer is always "no match": tests therefore see the `md` and up view, dialog
 * instead of drawer. The state logic inside is the same.
 */
if (typeof window !== "undefined") {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList
}

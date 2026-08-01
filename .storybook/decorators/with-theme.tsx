import { useEffect } from "react"
import type { Decorator } from "@storybook/react-vite"

import { applyResolvedTheme } from "@/components/theme/theme"
import type { ResolvedTheme } from "@/components/theme/theme"

/**
 * Switches light and dark from the toolbar.
 *
 * Deliberately not the real `ThemeProvider`: it reads `localStorage`, listens to
 * `prefers-color-scheme` and would immediately overwrite the toolbar choice. Stories that
 * show the provider itself (`ThemeMenu`, `ThemeSettings`) add it as their own decorator.
 *
 * It applies the same function as the application, so no second notion of what "dark"
 * means on the document arises here.
 */
export const withTheme: Decorator = (Story, context) => {
  const theme = context.globals.theme as ResolvedTheme

  useEffect(() => {
    applyResolvedTheme(document.documentElement, theme)
  }, [theme])

  return <Story />
}

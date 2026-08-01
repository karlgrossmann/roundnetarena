import { useEffect } from "react"
import type { Decorator } from "@storybook/react-vite"

import { getTextDirection, overwriteGetLocale } from "@/paraglide/runtime.js"
import type { Locale } from "@/paraglide/runtime.js"

/**
 * Switches the language from the toolbar.
 *
 * `overwriteGetLocale` is set synchronously during render, not in an effect: the messages
 * read the locale while rendering, so an effect would arrive one pass too late and the
 * story would briefly show the previous language.
 *
 * The application's cookie strategy stays out of it — Storybook has no request to derive
 * a language from.
 */
export const withLocale: Decorator = (Story, context) => {
  const locale = context.globals.locale as Locale

  overwriteGetLocale(() => locale)

  useEffect(() => {
    document.documentElement.lang = locale
    document.documentElement.dir = getTextDirection(locale)
  }, [locale])

  return <Story />
}

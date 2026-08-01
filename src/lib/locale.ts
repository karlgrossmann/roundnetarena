import { getLocale, getTextDirection } from "@/paraglide/runtime.js"

/** Request-scoped document attributes; the Paraglide middleware provides the context. */
export function documentLocaleAttributes(): {
  lang: ReturnType<typeof getLocale>
  dir: "ltr" | "rtl"
} {
  return {
    lang: getLocale(),
    dir: getTextDirection(),
  }
}

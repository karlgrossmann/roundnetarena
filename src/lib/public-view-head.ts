import type { PageTitleKey } from "./i18n"
import { localizedRouteHead } from "./i18n"

export function publicViewRouteHead(key: PageTitleKey) {
  const head = localizedRouteHead(key)
  return {
    ...head,
    meta: [
      ...head.meta,
      { name: "robots", content: "noindex, nofollow, noarchive" },
      { name: "referrer", content: "no-referrer" },
    ],
  }
}

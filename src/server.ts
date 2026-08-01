import handler, { createServerEntry } from "@tanstack/react-start/server-entry"

import { paraglideMiddleware } from "./paraglide/server.js"
import {
  applyEmailLocaleToRequest,
  persistEmailLocale,
} from "./server/auth/email-locale"
import { getAuthEnvironment, getEmailEnvironment } from "./server/config"

// Validate auth and mail configuration at startup, not on the first sign-in.
getAuthEnvironment()
getEmailEnvironment()

export default createServerEntry({
  fetch(request) {
    const localized = applyEmailLocaleToRequest(request)
    return paraglideMiddleware(localized.request, async () => {
      const response = await handler.fetch(localized.request)
      return persistEmailLocale(response, request.url, localized.locale)
    })
  },
})

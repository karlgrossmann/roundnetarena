import { createMiddleware } from "@tanstack/react-start"

/**
 * Shared boundary for all read-only viewer functions. The organization-scoped session
 * is verified in the handler after input validation, because only there are the slug
 * and the league known.
 */
export const publicViewRequest = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const { getCookies, setResponseHeader } =
      await import("@tanstack/react-start/server")
    setResponseHeader("Cache-Control", "private, no-store")
    return next({ context: { publicViewCookies: getCookies() } })
  }
)

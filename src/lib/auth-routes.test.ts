import { describe, expect, it } from "vitest"

import { isPublicAuthPath, safeAuthRedirect } from "./auth-routes"

describe("safe auth redirect", () => {
  it("keeps local invitation routes", () => {
    expect(safeAuthRedirect("/accept-invitation?id=invite")).toBe(
      "/accept-invitation?id=invite"
    )
  })

  it("rejects external and protocol-relative targets", () => {
    expect(safeAuthRedirect("https://example.com")).toBe("/")
    expect(safeAuthRedirect("//example.com")).toBe("/")
  })

  it("allows the public join-link landing page", () => {
    expect(isPublicAuthPath("/join")).toBe(true)
  })
})

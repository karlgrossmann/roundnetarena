// @vitest-environment node

import { afterEach, describe, expect, it, vi } from "vitest"

import {
  createPublicViewSession,
  publicViewCookieName,
  verifyPublicViewSession,
} from "./public-view-session.server"

afterEach(() => {
  vi.unstubAllEnvs()
})

describe("public view session", () => {
  it("binds a signed session to organization, version and expiry", () => {
    stubEnvironment()
    const now = new Date("2026-07-29T12:00:00.000Z")
    const token = createPublicViewSession("organization-a", 3, now)
    const claims = verifyPublicViewSession(
      token,
      new Date("2026-07-29T13:00:00.000Z")
    )

    expect(claims).toMatchObject({
      organizationId: "organization-a",
      credentialVersion: 3,
    })
    expect(
      verifyPublicViewSession(
        `${token.slice(0, -1)}x`,
        new Date("2026-07-29T13:00:00.000Z")
      )
    ).toBeNull()
    expect(
      verifyPublicViewSession(token, new Date("2026-07-30T12:00:01.000Z"))
    ).toBeNull()
  })

  it("uses stable, per-organization cookie names", () => {
    expect(publicViewCookieName("organization-a")).toBe(
      publicViewCookieName("organization-a")
    )
    expect(publicViewCookieName("organization-a")).not.toBe(
      publicViewCookieName("organization-b")
    )
  })
})

function stubEnvironment() {
  vi.stubEnv(
    "DATABASE_URL",
    "postgresql://roundnet:roundnet@localhost:54329/roundnet"
  )
  vi.stubEnv(
    "BETTER_AUTH_SECRET",
    "test-secret-with-at-least-thirty-two-characters"
  )
  vi.stubEnv("BETTER_AUTH_URL", "https://app.example.com")
}

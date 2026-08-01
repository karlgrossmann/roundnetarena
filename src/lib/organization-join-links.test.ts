import { describe, expect, it } from "vitest"

import {
  organizationJoinLinkCacheKey,
  organizationJoinLinkStatus,
  organizationJoinTokenFromRedirect,
} from "./organization-join-links"

describe("organizationJoinLinkStatus", () => {
  const now = new Date("2026-07-28T12:00:00.000Z")

  it("prioritizes revocation and expiry over the usage limit", () => {
    expect(
      organizationJoinLinkStatus(
        {
          expiresAt: new Date("2026-07-29T12:00:00.000Z"),
          maxUses: 1,
          usedCount: 1,
          revokedAt: now,
        },
        now
      )
    ).toBe("revoked")
    expect(
      organizationJoinLinkStatus(
        {
          expiresAt: now,
          maxUses: 1,
          usedCount: 1,
          revokedAt: null,
        },
        now
      )
    ).toBe("expired")
  })

  it("recognizes active and exhausted links", () => {
    expect(
      organizationJoinLinkStatus(
        {
          expiresAt: new Date("2026-07-29T12:00:00.000Z"),
          maxUses: 2,
          usedCount: 1,
          revokedAt: null,
        },
        now
      )
    ).toBe("active")
    expect(
      organizationJoinLinkStatus(
        {
          expiresAt: new Date("2026-07-29T12:00:00.000Z"),
          maxUses: 2,
          usedCount: 2,
          revokedAt: null,
        },
        now
      )
    ).toBe("exhausted")
  })
})

describe("organizationJoinTokenFromRedirect", () => {
  it("reads tokens only from the designated join path", () => {
    expect(
      organizationJoinTokenFromRedirect("/join?token=secret%2Bvalue")
    ).toBe("secret+value")
    expect(organizationJoinTokenFromRedirect("/clubs?token=secret")).toBeNull()
    expect(organizationJoinTokenFromRedirect(undefined)).toBeNull()
  })
})

it("never puts the full token into the query key", () => {
  const token = "secret-prefix-abcdefghijklmnop"
  const key = organizationJoinLinkCacheKey(token)
  expect(key).toBe("efghijklmnop")
  expect(key).not.toContain("secret-prefix")
})

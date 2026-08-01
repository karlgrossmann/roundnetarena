// @vitest-environment node

import { describe, expect, it } from "vitest"

import {
  ORGANIZATION_LOGO_UPLOAD_TTL_MS,
  createOrganizationLogoUploadGrant,
  verifyOrganizationLogoUploadGrant,
} from "./organization-logo-grant.server"

const SECRET = "storage-secret-that-must-never-reach-the-client"
const ORGANIZATION_ID = "1bc32695-bbb2-4dd6-8e50-cd5d3a069522"
const NOW = new Date("2026-07-28T12:00:00.000Z")

describe("organization logo upload grants", () => {
  it("binds the upload to exactly one organization path for five minutes", () => {
    const created = createOrganizationLogoUploadGrant(
      ORGANIZATION_ID,
      SECRET,
      NOW,
      "fixed-nonce"
    )

    expect(created).toMatchObject({
      path: `${ORGANIZATION_ID}/fixed-nonce.webp`,
      expiresAt: new Date(
        NOW.getTime() + ORGANIZATION_LOGO_UPLOAD_TTL_MS
      ).toISOString(),
    })
    expect(
      verifyOrganizationLogoUploadGrant(
        created.grant,
        ORGANIZATION_ID,
        SECRET,
        new Date(NOW.getTime() + ORGANIZATION_LOGO_UPLOAD_TTL_MS - 1)
      )
    ).toMatchObject({ organizationId: ORGANIZATION_ID, path: created.path })
    expect(created.grant).not.toContain(SECRET)
  })

  it("cannot be redirected to a different organization", () => {
    const created = createOrganizationLogoUploadGrant(
      ORGANIZATION_ID,
      SECRET,
      NOW
    )

    expect(() =>
      verifyOrganizationLogoUploadGrant(
        created.grant,
        "3a1d960d-d1b0-48d3-8b40-646c11f962d0",
        SECRET,
        NOW
      )
    ).toThrow("organization.logo_upload_expired")
  })

  it("rejects tampered and expired grants", () => {
    const created = createOrganizationLogoUploadGrant(
      ORGANIZATION_ID,
      SECRET,
      NOW
    )

    expect(() =>
      verifyOrganizationLogoUploadGrant(
        `${created.grant}changed`,
        ORGANIZATION_ID,
        SECRET,
        NOW
      )
    ).toThrow("organization.logo_upload_expired")
    expect(() =>
      verifyOrganizationLogoUploadGrant(
        created.grant,
        ORGANIZATION_ID,
        SECRET,
        new Date(NOW.getTime() + ORGANIZATION_LOGO_UPLOAD_TTL_MS)
      )
    ).toThrow("organization.logo_upload_expired")
  })
})

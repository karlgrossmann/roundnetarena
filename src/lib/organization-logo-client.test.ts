import { describe, expect, it } from "vitest"

import { organizationLogoFilePayload } from "./organization-logo-client"
import { ORGANIZATION_LOGO_MAX_BYTES } from "./organization-logo"

describe("organization logo client validation", () => {
  it("rejects disallowed types before reading the file", async () => {
    const file = new File(["<svg />"], "logo.svg", {
      type: "image/svg+xml",
    })

    await expect(organizationLogoFilePayload(file)).rejects.toThrow(
      "organization.logo_invalid_type"
    )
  })

  it("rejects oversized files before image processing and upload", async () => {
    const file = new File(
      [new Uint8Array(ORGANIZATION_LOGO_MAX_BYTES + 1)],
      "logo.png",
      { type: "image/png" }
    )

    await expect(organizationLogoFilePayload(file)).rejects.toThrow(
      "organization.logo_too_large"
    )
  })
})

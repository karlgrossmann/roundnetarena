// @vitest-environment node

import { describe, expect, it } from "vitest"

import {
  hashPublicViewPassword,
  verifyPublicViewPassword,
} from "./public-view-password.server"

describe("public view password", () => {
  it("stores salted hashes and verifies in constant time against the hash", async () => {
    const first = await hashPublicViewPassword("shared secret")
    const second = await hashPublicViewPassword("shared secret")

    expect(first).not.toBe(second)
    expect(first).not.toContain("shared secret")
    await expect(
      verifyPublicViewPassword("shared secret", first)
    ).resolves.toBe(true)
    await expect(verifyPublicViewPassword("wrong", first)).resolves.toBe(false)
  })

  it("rejects unknown hash formats", async () => {
    await expect(
      verifyPublicViewPassword("secret", "not-a-valid-hash")
    ).resolves.toBe(false)
  })
})

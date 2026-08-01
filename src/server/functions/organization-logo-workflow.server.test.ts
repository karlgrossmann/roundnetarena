// @vitest-environment node

import { describe, expect, it, vi } from "vitest"

import {
  clearOrganizationLogo,
  finalizeOrganizationLogo,
} from "./organization-logo-workflow.server"
import type { OrganizationLogoWorkflowDependencies } from "./organization-logo-workflow.server"

const ORGANIZATION_ID = "1bc32695-bbb2-4dd6-8e50-cd5d3a069522"
const PATH = `${ORGANIZATION_ID}/upload-nonce.webp`

describe("organization logo workflow", () => {
  it("publishes a validated logo and updates the organization profile", async () => {
    const dependencies = makeDependencies()

    await expect(
      finalizeOrganizationLogo(
        {
          organizationId: ORGANIZATION_ID,
          path: PATH,
          bytes: normalizedWebp(),
        },
        dependencies
      )
    ).resolves.toBe("https://storage.example/logo.webp?v=upload-nonce")
    expect(dependencies.removeUpload).toHaveBeenCalledWith(PATH)
    expect(dependencies.updateProfile).toHaveBeenCalledWith(
      ORGANIZATION_ID,
      "https://storage.example/logo.webp?v=upload-nonce"
    )
  })

  it("restores the previous object when the profile update fails", async () => {
    const previousBytes = new Uint8Array([1, 2, 3])
    const dependencies = makeDependencies({
      publish: vi.fn().mockResolvedValue({
        publicUrl: "https://storage.example/logo.webp",
        previousBytes,
      }),
      updateProfile: vi.fn().mockRejectedValue(new Error("profile failed")),
    })

    await expect(
      finalizeOrganizationLogo(
        {
          organizationId: ORGANIZATION_ID,
          path: PATH,
          bytes: normalizedWebp(),
        },
        dependencies
      )
    ).rejects.toThrow("profile failed")
    expect(dependencies.restore).toHaveBeenCalledWith(
      ORGANIZATION_ID,
      previousBytes
    )
  })

  it("restores the profile path when removing from storage fails", async () => {
    const dependencies = makeDependencies({
      removeObjects: vi.fn().mockRejectedValue(new Error("storage failed")),
    })
    const previousLogo = "https://storage.example/logo.webp?v=old"

    await expect(
      clearOrganizationLogo(ORGANIZATION_ID, previousLogo, dependencies)
    ).rejects.toThrow("storage failed")
    expect(dependencies.updateProfile).toHaveBeenNthCalledWith(
      1,
      ORGANIZATION_ID,
      null
    )
    expect(dependencies.updateProfile).toHaveBeenNthCalledWith(
      2,
      ORGANIZATION_ID,
      previousLogo
    )
  })
})

function makeDependencies(
  overrides: Partial<OrganizationLogoWorkflowDependencies> = {}
): OrganizationLogoWorkflowDependencies {
  return {
    removeUpload: vi.fn().mockResolvedValue(undefined),
    publish: vi.fn().mockResolvedValue({
      publicUrl: "https://storage.example/logo.webp",
      previousBytes: null,
    }),
    restore: vi.fn().mockResolvedValue(undefined),
    removeObjects: vi.fn().mockResolvedValue(undefined),
    updateProfile: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

function normalizedWebp(): Uint8Array {
  const bytes = new Uint8Array(30)
  bytes.set([0x52, 0x49, 0x46, 0x46], 0)
  bytes.set([0x57, 0x45, 0x42, 0x50], 8)
  bytes.set([0x56, 0x50, 0x38, 0x58], 12)
  writeUint24(bytes, 24, 511)
  writeUint24(bytes, 27, 511)
  return bytes
}

function writeUint24(bytes: Uint8Array, offset: number, value: number) {
  bytes[offset] = value & 0xff
  bytes[offset + 1] = (value >>> 8) & 0xff
  bytes[offset + 2] = (value >>> 16) & 0xff
}

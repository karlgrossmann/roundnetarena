import { describe, expect, it } from "vitest"

import {
  ORGANIZATION_LOGO_MAX_BYTES,
  isOrganizationLogoInputType,
  validateNormalizedOrganizationLogo,
  validateOrganizationLogoInput,
} from "./organization-logo"

describe("organization logo validation", () => {
  it("reads PNG dimensions and accepts allowed input", () => {
    expect(
      validateOrganizationLogoInput(pngHeader(1024, 640), "image/png")
    ).toEqual({ width: 1024, height: 640 })
  })

  it("compares the declared type against the file signature", () => {
    expect(() =>
      validateOrganizationLogoInput(pngHeader(100, 100), "image/jpeg")
    ).toThrow("organization.logo_invalid_type")
  })

  it("rejects oversized files before image processing", () => {
    expect(() =>
      validateOrganizationLogoInput(
        new Uint8Array(ORGANIZATION_LOGO_MAX_BYTES + 1),
        "image/png"
      )
    ).toThrow("organization.logo_too_large")
  })

  it("rejects input dimensions above 1024 pixels", () => {
    expect(() =>
      validateOrganizationLogoInput(pngHeader(1025, 512), "image/png")
    ).toThrow("organization.logo_dimensions")
  })

  it("accepts only normalized WebP files as the finished logo", () => {
    expect(validateNormalizedOrganizationLogo(webpXHeader(512, 512))).toEqual({
      width: 512,
      height: 512,
    })
    expect(() =>
      validateNormalizedOrganizationLogo(webpXHeader(511, 512))
    ).toThrow("organization.logo_not_normalized")
  })

  it("recognizes only the three allowed MIME types", () => {
    expect(isOrganizationLogoInputType("image/webp")).toBe(true)
    expect(isOrganizationLogoInputType("image/svg+xml")).toBe(false)
  })
})

function pngHeader(width: number, height: number): Uint8Array {
  const bytes = new Uint8Array(24)
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  bytes.set([0x49, 0x48, 0x44, 0x52], 12)
  writeUint32BigEndian(bytes, 16, width)
  writeUint32BigEndian(bytes, 20, height)
  return bytes
}

function webpXHeader(width: number, height: number): Uint8Array {
  const bytes = new Uint8Array(30)
  bytes.set([0x52, 0x49, 0x46, 0x46], 0)
  bytes.set([0x57, 0x45, 0x42, 0x50], 8)
  bytes.set([0x56, 0x50, 0x38, 0x58], 12)
  writeUint24LittleEndian(bytes, 24, width - 1)
  writeUint24LittleEndian(bytes, 27, height - 1)
  return bytes
}

function writeUint32BigEndian(
  bytes: Uint8Array,
  offset: number,
  value: number
) {
  bytes[offset] = (value >>> 24) & 0xff
  bytes[offset + 1] = (value >>> 16) & 0xff
  bytes[offset + 2] = (value >>> 8) & 0xff
  bytes[offset + 3] = value & 0xff
}

function writeUint24LittleEndian(
  bytes: Uint8Array,
  offset: number,
  value: number
) {
  bytes[offset] = value & 0xff
  bytes[offset + 1] = (value >>> 8) & 0xff
  bytes[offset + 2] = (value >>> 16) & 0xff
}

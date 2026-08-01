import { DomainError } from "./domain-errors"

export const ORGANIZATION_LOGO_INPUT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const
export const ORGANIZATION_LOGO_MAX_BYTES = 2 * 1024 * 1024
export const ORGANIZATION_LOGO_MAX_DIMENSION = 1024
export const ORGANIZATION_LOGO_OUTPUT_DIMENSION = 512

export type OrganizationLogoInputType =
  (typeof ORGANIZATION_LOGO_INPUT_TYPES)[number]

export interface ImageDimensions {
  width: number
  height: number
}

export function isOrganizationLogoInputType(
  value: string
): value is OrganizationLogoInputType {
  return ORGANIZATION_LOGO_INPUT_TYPES.some((type) => type === value)
}

export function validateOrganizationLogoInput(
  bytes: Uint8Array,
  contentType: OrganizationLogoInputType
): ImageDimensions {
  if (bytes.byteLength > ORGANIZATION_LOGO_MAX_BYTES) {
    throw new DomainError("organization.logo_too_large")
  }

  const detectedType = detectImageType(bytes)
  if (detectedType !== contentType) {
    throw new DomainError("organization.logo_invalid_type")
  }

  const dimensions = readImageDimensions(bytes, detectedType)
  if (!dimensions || dimensions.width < 1 || dimensions.height < 1) {
    throw new DomainError("organization.logo_invalid_image")
  }
  if (
    dimensions.width > ORGANIZATION_LOGO_MAX_DIMENSION ||
    dimensions.height > ORGANIZATION_LOGO_MAX_DIMENSION
  ) {
    throw new DomainError("organization.logo_dimensions")
  }
  return dimensions
}

export function validateNormalizedOrganizationLogo(
  bytes: Uint8Array
): ImageDimensions {
  const dimensions = validateOrganizationLogoInput(bytes, "image/webp")
  if (
    dimensions.width !== ORGANIZATION_LOGO_OUTPUT_DIMENSION ||
    dimensions.height !== ORGANIZATION_LOGO_OUTPUT_DIMENSION
  ) {
    throw new DomainError("organization.logo_not_normalized")
  }
  return dimensions
}

function detectImageType(bytes: Uint8Array): OrganizationLogoInputType | null {
  if (
    bytes.length >= 24 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png"
  }
  if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    return "image/jpeg"
  }
  if (
    bytes.length >= 30 &&
    ascii(bytes, 0, 4) === "RIFF" &&
    ascii(bytes, 8, 12) === "WEBP"
  ) {
    return "image/webp"
  }
  return null
}

function readImageDimensions(
  bytes: Uint8Array,
  contentType: OrganizationLogoInputType
): ImageDimensions | null {
  if (contentType === "image/png") return readPngDimensions(bytes)
  if (contentType === "image/jpeg") return readJpegDimensions(bytes)
  return readWebpDimensions(bytes)
}

function readPngDimensions(bytes: Uint8Array): ImageDimensions | null {
  if (ascii(bytes, 12, 16) !== "IHDR") return null
  return {
    width: readUint32BigEndian(bytes, 16),
    height: readUint32BigEndian(bytes, 20),
  }
}

function readJpegDimensions(bytes: Uint8Array): ImageDimensions | null {
  let offset = 2
  while (offset + 8 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1
      continue
    }
    while (bytes[offset] === 0xff) offset += 1
    const marker = bytes[offset]
    offset += 1
    if (marker === 0xd9 || marker === 0xda) return null
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue
    if (offset + 1 >= bytes.length) return null
    const length = (bytes[offset] ?? 0) * 256 + (bytes[offset + 1] ?? 0)
    if (length < 2 || offset + length > bytes.length) return null
    if (isStartOfFrame(marker) && length >= 7) {
      return {
        height: (bytes[offset + 3] ?? 0) * 256 + (bytes[offset + 4] ?? 0),
        width: (bytes[offset + 5] ?? 0) * 256 + (bytes[offset + 6] ?? 0),
      }
    }
    offset += length
  }
  return null
}

function isStartOfFrame(marker: number): boolean {
  return (
    marker >= 0xc0 &&
    marker <= 0xcf &&
    marker !== 0xc4 &&
    marker !== 0xc8 &&
    marker !== 0xcc
  )
}

function readWebpDimensions(bytes: Uint8Array): ImageDimensions | null {
  const chunk = ascii(bytes, 12, 16)
  if (chunk === "VP8X" && bytes.length >= 30) {
    return {
      width: 1 + readUint24LittleEndian(bytes, 24),
      height: 1 + readUint24LittleEndian(bytes, 27),
    }
  }
  if (
    chunk === "VP8 " &&
    bytes.length >= 30 &&
    bytes[23] === 0x9d &&
    bytes[24] === 0x01 &&
    bytes[25] === 0x2a
  ) {
    return {
      width: readUint16LittleEndian(bytes, 26) & 0x3fff,
      height: readUint16LittleEndian(bytes, 28) & 0x3fff,
    }
  }
  if (chunk === "VP8L" && bytes.length >= 25 && bytes[20] === 0x2f) {
    const byte1 = bytes[21]
    const byte2 = bytes[22]
    const byte3 = bytes[23]
    const byte4 = bytes[24]
    return {
      width: 1 + (((byte2 & 0x3f) << 8) | byte1),
      height:
        1 + (((byte4 & 0x0f) << 10) | (byte3 << 2) | ((byte2 & 0xc0) >> 6)),
    }
  }
  return null
}

function ascii(bytes: Uint8Array, start: number, end: number): string {
  return String.fromCharCode(...bytes.slice(start, end))
}

function readUint16LittleEndian(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] ?? 0) | ((bytes[offset + 1] ?? 0) << 8)
}

function readUint24LittleEndian(bytes: Uint8Array, offset: number): number {
  return (
    (bytes[offset] ?? 0) |
    ((bytes[offset + 1] ?? 0) << 8) |
    ((bytes[offset + 2] ?? 0) << 16)
  )
}

function readUint32BigEndian(bytes: Uint8Array, offset: number): number {
  return (
    (bytes[offset] ?? 0) * 0x1000000 +
    (bytes[offset + 1] ?? 0) * 0x10000 +
    (bytes[offset + 2] ?? 0) * 0x100 +
    (bytes[offset + 3] ?? 0)
  )
}

import "@tanstack/react-start/server-only"

import { createHmac, randomUUID, timingSafeEqual } from "node:crypto"

import { DomainError } from "@/lib/domain-errors"

export const ORGANIZATION_LOGO_UPLOAD_TTL_MS = 5 * 60 * 1000

interface OrganizationLogoGrantPayload {
  version: 1
  organizationId: string
  path: string
  expiresAt: number
}

export interface OrganizationLogoUploadGrant {
  grant: string
  path: string
  expiresAt: string
}

export function createOrganizationLogoUploadGrant(
  organizationId: string,
  secret: string,
  now: Date = new Date(),
  nonce: string = randomUUID()
): OrganizationLogoUploadGrant {
  const payload: OrganizationLogoGrantPayload = {
    version: 1,
    organizationId,
    path: `${organizationId}/${nonce}.webp`,
    expiresAt: now.getTime() + ORGANIZATION_LOGO_UPLOAD_TTL_MS,
  }
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
    "base64url"
  )
  return {
    grant: `${encodedPayload}.${signature(encodedPayload, secret)}`,
    path: payload.path,
    expiresAt: new Date(payload.expiresAt).toISOString(),
  }
}

export function verifyOrganizationLogoUploadGrant(
  grant: string,
  organizationId: string,
  secret: string,
  now: Date = new Date()
): OrganizationLogoGrantPayload {
  const [encodedPayload, encodedSignature, extra] = grant.split(".")
  if (!encodedPayload || !encodedSignature || extra) {
    throw new DomainError("organization.logo_upload_expired")
  }
  const expectedSignature = signature(encodedPayload, secret)
  const actual = Buffer.from(encodedSignature)
  const expected = Buffer.from(expectedSignature)
  if (
    actual.byteLength !== expected.byteLength ||
    !timingSafeEqual(actual, expected)
  ) {
    throw new DomainError("organization.logo_upload_expired")
  }

  const payload = parsePayload(encodedPayload)
  if (
    payload.organizationId !== organizationId ||
    payload.expiresAt <= now.getTime() ||
    payload.path !== `${organizationId}/${payload.path.split("/").at(-1)}` ||
    !payload.path.endsWith(".webp")
  ) {
    throw new DomainError("organization.logo_upload_expired")
  }
  return payload
}

function signature(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url")
}

function parsePayload(encodedPayload: string): OrganizationLogoGrantPayload {
  try {
    const value: unknown = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8")
    )
    if (
      typeof value !== "object" ||
      value === null ||
      !("version" in value) ||
      value.version !== 1 ||
      !("organizationId" in value) ||
      typeof value.organizationId !== "string" ||
      !("path" in value) ||
      typeof value.path !== "string" ||
      !("expiresAt" in value) ||
      typeof value.expiresAt !== "number"
    ) {
      throw new Error("invalid")
    }
    return value as OrganizationLogoGrantPayload
  } catch {
    throw new DomainError("organization.logo_upload_expired")
  }
}

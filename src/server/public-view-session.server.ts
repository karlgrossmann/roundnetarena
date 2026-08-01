import "@tanstack/react-start/server-only"

import { createHash, createHmac, timingSafeEqual } from "node:crypto"

import { PUBLIC_VIEW_SESSION_SECONDS } from "@/lib/public-view"

import { getAuthEnvironment } from "./config"

interface PublicViewSessionClaims {
  organizationId: string
  credentialVersion: number
  expiresAt: number
}

const COOKIE_PREFIX = "roundnet-view-"
const SIGNING_CONTEXT = "roundnet-public-view-session-v1"

export function publicViewCookieName(organizationId: string): string {
  const suffix = createHash("sha256")
    .update(organizationId, "utf8")
    .digest("hex")
    .slice(0, 16)
  return `${COOKIE_PREFIX}${suffix}`
}

export function createPublicViewSession(
  organizationId: string,
  credentialVersion: number,
  now: Date
): string {
  const claims: PublicViewSessionClaims = {
    organizationId,
    credentialVersion,
    expiresAt: Math.floor(now.getTime() / 1000) + PUBLIC_VIEW_SESSION_SECONDS,
  }
  const payload = Buffer.from(JSON.stringify(claims), "utf8").toString(
    "base64url"
  )
  return `${payload}.${signature(payload)}`
}

export function verifyPublicViewSession(
  token: string,
  now: Date
): PublicViewSessionClaims | null {
  const [payload, suppliedSignature, ...rest] = token.split(".")
  if (!payload || !suppliedSignature || rest.length > 0) return null
  const expectedSignature = signature(payload)
  const supplied = Buffer.from(suppliedSignature, "base64url")
  const expected = Buffer.from(expectedSignature, "base64url")
  if (
    supplied.length !== expected.length ||
    !timingSafeEqual(supplied, expected)
  ) {
    return null
  }
  try {
    const claims = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    ) as Partial<PublicViewSessionClaims>
    if (
      typeof claims.organizationId !== "string" ||
      typeof claims.credentialVersion !== "number" ||
      !Number.isInteger(claims.credentialVersion) ||
      typeof claims.expiresAt !== "number" ||
      claims.expiresAt <= Math.floor(now.getTime() / 1000)
    ) {
      return null
    }
    return claims as PublicViewSessionClaims
  } catch {
    return null
  }
}

function signature(payload: string): string {
  const key = createHmac("sha256", getAuthEnvironment().secret)
    .update(SIGNING_CONTEXT, "utf8")
    .digest()
  return createHmac("sha256", key).update(payload, "utf8").digest("base64url")
}

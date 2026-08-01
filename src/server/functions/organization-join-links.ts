import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"

import { DomainError } from "@/lib/domain-errors"
import {
  ORGANIZATION_JOIN_LINK_MAX_DAYS,
  ORGANIZATION_JOIN_LINK_MAX_USES,
} from "@/lib/organization-join-links"
import { hasOrganizationPermission } from "@/lib/organization-permissions"
import type {
  CreatedOrganizationJoinLink,
  OrganizationJoinLinkAcceptance,
  OrganizationJoinLinkPreview,
} from "@/lib/types"

import { getAuthEnvironment } from "../config"
import { getDb } from "../db/client"
import { authed } from "../middleware/auth"
import {
  acceptOrganizationJoinLink as acceptJoinLinkInRepository,
  consumeJoinLinkRateLimit,
  createOrganizationJoinToken,
  hashJoinLinkRateLimitIdentity,
  hashOrganizationJoinToken,
  insertOrganizationJoinLink,
  inspectOrganizationJoinLink as inspectJoinLinkInRepository,
  JoinLinkUnavailableError,
  revokeOrganizationJoinLink as revokeJoinLinkInRepository,
} from "../repositories/organization-join-links"
import { findOrganizationMembership } from "../repositories/organizations"

const TEN_MINUTES = 10 * 60 * 1000
const TokenSchema = z.object({ token: z.string().min(20).max(256) })
const OrganizationIdSchema = z.object({ organizationId: z.uuid() })

export const createOrganizationJoinLink = createServerFn({ method: "POST" })
  .middleware([authed])
  .validator(
    OrganizationIdSchema.extend({
      expiresInDays: z
        .number()
        .int()
        .min(1)
        .max(ORGANIZATION_JOIN_LINK_MAX_DAYS),
      maxUses: z.number().int().min(1).max(ORGANIZATION_JOIN_LINK_MAX_USES),
    })
  )
  .handler(async ({ context, data }): Promise<CreatedOrganizationJoinLink> => {
    await requireJoinLinkManagement(data.organizationId, context.auth.user.id)
    const now = new Date()
    const token = createOrganizationJoinToken()
    const expiresAt = new Date(
      now.getTime() + data.expiresInDays * 24 * 60 * 60 * 1000
    )
    const link = await getDb().transaction((tx) =>
      insertOrganizationJoinLink(
        tx,
        {
          actorUserId: context.auth.user.id,
          organizationId: data.organizationId,
          tokenHash: hashOrganizationJoinToken(token),
          expiresAt,
          maxUses: data.maxUses,
        },
        now
      )
    )
    const url = new URL("/join", getAuthEnvironment().baseUrl)
    url.searchParams.set("token", token)
    return { link, url: url.toString() }
  })

export const revokeOrganizationJoinLink = createServerFn({ method: "POST" })
  .middleware([authed])
  .validator(
    OrganizationIdSchema.extend({
      joinLinkId: z.uuid(),
    })
  )
  .handler(async ({ context, data }) => {
    await requireJoinLinkManagement(data.organizationId, context.auth.user.id)
    try {
      await getDb().transaction((tx) =>
        revokeJoinLinkInRepository(
          tx,
          {
            actorUserId: context.auth.user.id,
            organizationId: data.organizationId,
            joinLinkId: data.joinLinkId,
          },
          new Date()
        )
      )
    } catch (error) {
      throwJoinLinkError(error)
    }
    return { organizationId: data.organizationId }
  })

export const inspectOrganizationJoinLink = createServerFn({ method: "POST" })
  .validator(TokenSchema)
  .handler(async ({ data }): Promise<OrganizationJoinLinkPreview> => {
    const headers = await requestHeaders()
    const identity = [
      headers.get("x-forwarded-for")?.split(",", 1)[0]?.trim() ??
        headers.get("cf-connecting-ip") ??
        "unknown",
      headers.get("user-agent") ?? "unknown",
    ].join(":")
    const allowed = await consumeJoinLinkRateLimit(
      `organization-join-link:inspect:${hashJoinLinkRateLimitIdentity(identity)}`,
      new Date(),
      TEN_MINUTES,
      30
    )
    if (!allowed) return { status: "rate_limited" }
    return inspectJoinLinkInRepository(
      getDb(),
      hashOrganizationJoinToken(data.token),
      new Date()
    )
  })

export const acceptOrganizationJoinLink = createServerFn({ method: "POST" })
  .middleware([authed])
  .validator(TokenSchema)
  .handler(
    async ({ context, data }): Promise<OrganizationJoinLinkAcceptance> => {
      const allowed = await consumeJoinLinkRateLimit(
        `organization-join-link:accept:${context.auth.user.id}`,
        new Date(),
        TEN_MINUTES,
        10
      )
      if (!allowed) {
        throw new DomainError("organization.join_link_rate_limited")
      }
      try {
        return await getDb().transaction((tx) =>
          acceptJoinLinkInRepository(
            tx,
            {
              tokenHash: hashOrganizationJoinToken(data.token),
              userId: context.auth.user.id,
            },
            new Date()
          )
        )
      } catch (error) {
        throwJoinLinkError(error)
      }
    }
  )

async function requireJoinLinkManagement(
  organizationId: string,
  userId: string
): Promise<void> {
  const membership = await findOrganizationMembership(
    getDb(),
    organizationId,
    userId
  )
  if (
    !membership ||
    !hasOrganizationPermission(membership.role, "member:invite")
  ) {
    throw new DomainError("organization.forbidden")
  }
}

function throwJoinLinkError(error: unknown): never {
  if (error instanceof JoinLinkUnavailableError) {
    switch (error.reason) {
      case "invalid":
        throw new DomainError("organization.join_link_invalid")
      case "expired":
        throw new DomainError("organization.join_link_expired")
      case "exhausted":
        throw new DomainError("organization.join_link_exhausted")
      case "revoked":
        throw new DomainError("organization.join_link_revoked")
    }
  }
  throw error
}

async function requestHeaders(): Promise<Headers> {
  const { getRequestHeaders } = await import("@tanstack/react-start/server")
  return getRequestHeaders()
}

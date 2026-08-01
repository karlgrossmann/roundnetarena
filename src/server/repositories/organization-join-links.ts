import "@tanstack/react-start/server-only"

import { createHash, randomBytes } from "node:crypto"
import { and, desc, eq, sql } from "drizzle-orm"

import {
  ORGANIZATION_JOIN_LINK_ROLE,
  organizationJoinLinkStatus,
  publicOrganizationJoinLinkStatus,
} from "@/lib/organization-join-links"
import type {
  OrganizationJoinLink,
  OrganizationJoinLinkAcceptance,
  OrganizationJoinLinkPreview,
} from "@/lib/types"

import { member, organization } from "../db/auth-schema"
import { getDb } from "../db/client"
import type { Executor, Transaction } from "../db/client"
import { organizationJoinLinks } from "../db/schema"
import {
  insertOrganizationAuditEvent,
  setOrganizationAuditActor,
} from "./organization-audit"
import { consumeRateLimit, hashRateLimitIdentity } from "./rate-limit"

export type JoinLinkFailure = "invalid" | "expired" | "exhausted" | "revoked"

export class JoinLinkUnavailableError extends Error {
  constructor(readonly reason: JoinLinkFailure) {
    super(reason)
    this.name = "JoinLinkUnavailableError"
  }
}

interface JoinLinkRow {
  id: string
  role: string
  expiresAt: Date
  maxUses: number
  usedCount: number
  revokedAt: Date | null
  createdAt: Date
}

export function createOrganizationJoinToken(): string {
  return randomBytes(32).toString("base64url")
}

export function hashOrganizationJoinToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex")
}

export function hashJoinLinkRateLimitIdentity(identity: string): string {
  return hashRateLimitIdentity(identity)
}

export async function consumeJoinLinkRateLimit(
  key: string,
  now: Date,
  windowMs: number,
  maximum: number
): Promise<boolean> {
  return consumeRateLimit(key, now, windowMs, maximum)
}

export async function listOrganizationJoinLinks(
  executor: Executor = getDb(),
  organizationId: string,
  now: Date
): Promise<Array<OrganizationJoinLink>> {
  const rows = await executor
    .select(joinLinkSelection)
    .from(organizationJoinLinks)
    .where(eq(organizationJoinLinks.organizationId, organizationId))
    .orderBy(desc(organizationJoinLinks.createdAt))

  return rows.map((row) => toOrganizationJoinLink(row, now))
}

export async function insertOrganizationJoinLink(
  tx: Transaction,
  input: {
    actorUserId: string
    expiresAt: Date
    maxUses: number
    organizationId: string
    tokenHash: string
  },
  now: Date
): Promise<OrganizationJoinLink> {
  await setOrganizationAuditActor(tx, input.actorUserId)
  const row = (
    await tx
      .insert(organizationJoinLinks)
      .values({
        organizationId: input.organizationId,
        tokenHash: input.tokenHash,
        role: ORGANIZATION_JOIN_LINK_ROLE,
        expiresAt: input.expiresAt,
        maxUses: input.maxUses,
        createdBy: input.actorUserId,
        createdAt: now,
      })
      .returning(joinLinkSelection)
  ).at(0)
  if (!row) throw new Error("Join link could not be stored.")

  await insertOrganizationAuditEvent(tx, {
    actorUserId: input.actorUserId,
    eventType: "organization.join_link_created",
    organizationId: input.organizationId,
    targetType: "join_link",
    targetId: row.id,
    metadata: {
      role: ORGANIZATION_JOIN_LINK_ROLE,
      maxUses: input.maxUses,
      expiresAt: input.expiresAt.toISOString(),
    },
    now,
  })
  return toOrganizationJoinLink(row, now)
}

export async function revokeOrganizationJoinLink(
  tx: Transaction,
  input: {
    actorUserId: string
    joinLinkId: string
    organizationId: string
  },
  now: Date
): Promise<void> {
  await setOrganizationAuditActor(tx, input.actorUserId)
  const revoked = (
    await tx
      .update(organizationJoinLinks)
      .set({ revokedAt: now })
      .where(
        and(
          eq(organizationJoinLinks.id, input.joinLinkId),
          eq(organizationJoinLinks.organizationId, input.organizationId),
          sql`${organizationJoinLinks.revokedAt} is null`
        )
      )
      .returning({ id: organizationJoinLinks.id })
  ).at(0)
  if (!revoked) throw new JoinLinkUnavailableError("invalid")

  await insertOrganizationAuditEvent(tx, {
    actorUserId: input.actorUserId,
    eventType: "organization.join_link_revoked",
    organizationId: input.organizationId,
    targetType: "join_link",
    targetId: revoked.id,
    metadata: {},
    now,
  })
}

export async function inspectOrganizationJoinLink(
  executor: Executor = getDb(),
  tokenHash: string,
  now: Date
): Promise<OrganizationJoinLinkPreview> {
  const row = (
    await executor
      .select({
        ...joinLinkSelection,
        organizationName: organization.name,
      })
      .from(organizationJoinLinks)
      .innerJoin(
        organization,
        eq(organization.id, organizationJoinLinks.organizationId)
      )
      .where(eq(organizationJoinLinks.tokenHash, tokenHash))
  ).at(0)
  if (!row) return { status: "invalid" }
  if (row.role !== ORGANIZATION_JOIN_LINK_ROLE) return { status: "invalid" }

  const status = organizationJoinLinkStatus(row, now)
  return {
    status: publicOrganizationJoinLinkStatus(status),
    organizationName: row.organizationName,
    role: ORGANIZATION_JOIN_LINK_ROLE,
    expiresAt: row.expiresAt.toISOString(),
    remainingUses: Math.max(0, row.maxUses - row.usedCount),
  }
}

export async function acceptOrganizationJoinLink(
  tx: Transaction,
  input: {
    tokenHash: string
    userId: string
  },
  now: Date
): Promise<OrganizationJoinLinkAcceptance> {
  await setOrganizationAuditActor(tx, input.userId)
  const link = (
    await tx
      .select({
        ...joinLinkSelection,
        organizationId: organizationJoinLinks.organizationId,
        organizationName: organization.name,
        organizationSlug: organization.slug,
      })
      .from(organizationJoinLinks)
      .innerJoin(
        organization,
        eq(organization.id, organizationJoinLinks.organizationId)
      )
      .where(eq(organizationJoinLinks.tokenHash, input.tokenHash))
      .for("update")
  ).at(0)
  if (!link) throw new JoinLinkUnavailableError("invalid")
  if (link.role !== ORGANIZATION_JOIN_LINK_ROLE) {
    throw new JoinLinkUnavailableError("invalid")
  }

  const status = organizationJoinLinkStatus(link, now)
  if (status !== "active") throw new JoinLinkUnavailableError(status)

  await tx.execute(
    sql`select pg_advisory_xact_lock(
      hashtextextended(${`${link.organizationId}:${input.userId}`}, 0)
    )`
  )
  const existingMembership = (
    await tx
      .select({ id: member.id })
      .from(member)
      .where(
        and(
          eq(member.organizationId, link.organizationId),
          eq(member.userId, input.userId)
        )
      )
  ).at(0)
  if (existingMembership) {
    return {
      organizationId: link.organizationId,
      organizationSlug: link.organizationSlug,
      organizationName: link.organizationName,
      alreadyMember: true,
    }
  }

  await tx.insert(member).values({
    organizationId: link.organizationId,
    userId: input.userId,
    role: ORGANIZATION_JOIN_LINK_ROLE,
    createdAt: now,
  })
  await tx
    .update(organizationJoinLinks)
    .set({ usedCount: sql`${organizationJoinLinks.usedCount} + 1` })
    .where(eq(organizationJoinLinks.id, link.id))
  await insertOrganizationAuditEvent(tx, {
    actorUserId: input.userId,
    eventType: "organization.join_link_accepted",
    organizationId: link.organizationId,
    targetType: "join_link",
    targetId: link.id,
    metadata: { role: ORGANIZATION_JOIN_LINK_ROLE },
    now,
  })

  return {
    organizationId: link.organizationId,
    organizationSlug: link.organizationSlug,
    organizationName: link.organizationName,
    alreadyMember: false,
  }
}

const joinLinkSelection = {
  id: organizationJoinLinks.id,
  role: organizationJoinLinks.role,
  expiresAt: organizationJoinLinks.expiresAt,
  maxUses: organizationJoinLinks.maxUses,
  usedCount: organizationJoinLinks.usedCount,
  revokedAt: organizationJoinLinks.revokedAt,
  createdAt: organizationJoinLinks.createdAt,
}

function toOrganizationJoinLink(
  row: JoinLinkRow,
  now: Date
): OrganizationJoinLink {
  if (row.role !== ORGANIZATION_JOIN_LINK_ROLE) {
    throw new Error("Unknown role for a join link.")
  }
  return {
    id: row.id,
    role: ORGANIZATION_JOIN_LINK_ROLE,
    expiresAt: row.expiresAt.toISOString(),
    maxUses: row.maxUses,
    usedCount: row.usedCount,
    status: organizationJoinLinkStatus(row, now),
    createdAt: row.createdAt.toISOString(),
  }
}

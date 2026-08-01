import "@tanstack/react-start/server-only"

import { and, count, desc, eq, sql } from "drizzle-orm"

import {
  ORGANIZATION_AUDIT_PAGE_SIZE,
  isOrganizationAuditEventType,
  isOrganizationAuditTargetType,
} from "@/lib/organization-audit"
import type {
  OrganizationAuditEntry,
  OrganizationAuditEventType,
  OrganizationAuditMetadataByEvent,
  OrganizationAuditPage,
  OrganizationAuditTargetType,
} from "@/lib/types"

import { member, user } from "../db/auth-schema"
import type { Executor, Transaction } from "../db/client"
import { organizationAuditLogs } from "../db/schema"

export async function setOrganizationAuditActor(
  tx: Transaction,
  userId: string
): Promise<void> {
  await tx.execute(
    sql`select set_config('app.current_user_id', ${userId}, true)`
  )
}

export async function insertOrganizationAuditEvent<
  TEvent extends OrganizationAuditEventType,
>(
  tx: Transaction,
  input: {
    actorUserId: string
    eventType: TEvent
    metadata: OrganizationAuditMetadataByEvent[TEvent]
    now: Date
    organizationId: string
    targetId: string
    targetType: OrganizationAuditTargetType
  }
): Promise<void> {
  await tx.insert(organizationAuditLogs).values({
    actorUserId: input.actorUserId,
    eventType: input.eventType,
    organizationId: input.organizationId,
    targetType: input.targetType,
    targetId: input.targetId,
    metadata: input.metadata,
    createdAt: input.now,
  })
}

export async function findOrganizationAuditPage(
  executor: Executor,
  organizationId: string,
  page: number
): Promise<OrganizationAuditPage> {
  const offset = (page - 1) * ORGANIZATION_AUDIT_PAGE_SIZE
  const rows = await executor
    .select({
      id: organizationAuditLogs.id,
      eventType: organizationAuditLogs.eventType,
      actorUserId: organizationAuditLogs.actorUserId,
      actorName: user.name,
      targetType: organizationAuditLogs.targetType,
      targetId: organizationAuditLogs.targetId,
      metadata: organizationAuditLogs.metadata,
      createdAt: organizationAuditLogs.createdAt,
    })
    .from(organizationAuditLogs)
    .leftJoin(user, eq(user.id, organizationAuditLogs.actorUserId))
    .where(eq(organizationAuditLogs.organizationId, organizationId))
    .orderBy(
      desc(organizationAuditLogs.createdAt),
      desc(organizationAuditLogs.id)
    )
    .limit(ORGANIZATION_AUDIT_PAGE_SIZE)
    .offset(offset)
  const totalRow = await executor
    .select({ value: count() })
    .from(organizationAuditLogs)
    .where(eq(organizationAuditLogs.organizationId, organizationId))
  const totalCount = totalRow.at(0)?.value ?? 0

  return {
    items: rows.map(toOrganizationAuditEntry),
    page,
    pageSize: ORGANIZATION_AUDIT_PAGE_SIZE,
    totalCount,
    totalPages: Math.max(
      1,
      Math.ceil(totalCount / ORGANIZATION_AUDIT_PAGE_SIZE)
    ),
  }
}

export async function hasOrganizationAuditOwnerAccess(
  executor: Executor,
  organizationId: string,
  userId: string
): Promise<boolean> {
  const row = (
    await executor
      .select({ id: member.id })
      .from(member)
      .where(
        and(
          eq(member.organizationId, organizationId),
          eq(member.userId, userId),
          eq(member.role, "owner")
        )
      )
      .limit(1)
  ).at(0)
  return Boolean(row)
}

function toOrganizationAuditEntry(row: {
  id: string
  eventType: string
  actorUserId: string | null
  actorName: string | null
  targetType: string
  targetId: string
  metadata: unknown
  createdAt: Date
}): OrganizationAuditEntry {
  if (
    !isOrganizationAuditEventType(row.eventType) ||
    !isOrganizationAuditTargetType(row.targetType) ||
    !isAuditMetadata(row.metadata)
  ) {
    throw new Error("Invalid audit entry in the database.")
  }

  return {
    id: row.id,
    eventType: row.eventType,
    actor:
      row.actorUserId && row.actorName
        ? { id: row.actorUserId, name: row.actorName }
        : null,
    targetType: row.targetType,
    targetId: row.targetId,
    metadata: row.metadata,
    createdAt: row.createdAt.toISOString(),
  }
}

function isAuditMetadata(
  value: unknown
): value is OrganizationAuditEntry["metadata"] {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

import "@tanstack/react-start/server-only"

import { and, eq, sql } from "drizzle-orm"

import { publicViewAccessPath } from "@/lib/public-view"
import { organizationBrandColorFromMetadata } from "@/lib/organization-brand"
import type {
  OrganizationPublicViewSettings,
  PublicViewContext,
} from "@/lib/types"

import { organization } from "../db/auth-schema"
import type { Executor, Transaction } from "../db/client"
import { leagues, organizationPublicViews } from "../db/schema"
import {
  insertOrganizationAuditEvent,
  setOrganizationAuditActor,
} from "./organization-audit"
import { findLeaguesForOrganization } from "./leagues"

export interface OrganizationPublicViewRecord {
  organizationId: string
  organizationName: string
  organizationSlug: string
  organizationLogo: string | null
  organizationMetadata: string | null
  enabled: boolean
  passwordHash: string | null
  credentialVersion: number
}

export async function findOrganizationPublicViewSettings(
  executor: Executor,
  organizationId: string,
  organizationSlug: string
): Promise<OrganizationPublicViewSettings> {
  const record = await findOrganizationPublicViewById(executor, organizationId)
  return {
    enabled: record?.enabled ?? false,
    hasPassword: Boolean(record?.passwordHash),
    accessPath: publicViewAccessPath(organizationSlug),
  }
}

export async function findOrganizationPublicViewBySlug(
  executor: Executor,
  organizationSlug: string
): Promise<OrganizationPublicViewRecord | null> {
  return findOrganizationPublicView(
    executor,
    eq(organization.slug, organizationSlug)
  )
}

export async function findOrganizationPublicViewById(
  executor: Executor,
  organizationId: string
): Promise<OrganizationPublicViewRecord | null> {
  return findOrganizationPublicView(
    executor,
    eq(organization.id, organizationId)
  )
}

export async function enableOrganizationPublicView(
  tx: Transaction,
  input: {
    actorUserId: string
    organizationId: string
    passwordHash: string
  },
  now: Date
): Promise<void> {
  await setOrganizationAuditActor(tx, input.actorUserId)
  const existing = await findOrganizationPublicViewById(
    tx,
    input.organizationId
  )
  await tx
    .insert(organizationPublicViews)
    .values({
      organizationId: input.organizationId,
      enabled: true,
      passwordHash: input.passwordHash,
      credentialVersion: (existing?.credentialVersion ?? 0) + 1,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: organizationPublicViews.organizationId,
      set: {
        enabled: true,
        passwordHash: input.passwordHash,
        credentialVersion: sql`${organizationPublicViews.credentialVersion} + 1`,
        updatedAt: now,
      },
    })
  await insertOrganizationAuditEvent(tx, {
    actorUserId: input.actorUserId,
    eventType: existing?.enabled
      ? "organization.public_view_password_changed"
      : "organization.public_view_enabled",
    metadata: {},
    now,
    organizationId: input.organizationId,
    targetId: input.organizationId,
    targetType: "organization",
  })
}

export async function disableOrganizationPublicView(
  tx: Transaction,
  input: { actorUserId: string; organizationId: string },
  now: Date
): Promise<void> {
  await setOrganizationAuditActor(tx, input.actorUserId)
  await tx
    .insert(organizationPublicViews)
    .values({
      organizationId: input.organizationId,
      enabled: false,
      passwordHash: null,
      credentialVersion: 1,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: organizationPublicViews.organizationId,
      set: {
        enabled: false,
        passwordHash: null,
        credentialVersion: sql`${organizationPublicViews.credentialVersion} + 1`,
        updatedAt: now,
      },
    })
  await insertOrganizationAuditEvent(tx, {
    actorUserId: input.actorUserId,
    eventType: "organization.public_view_disabled",
    metadata: {},
    now,
    organizationId: input.organizationId,
    targetId: input.organizationId,
    targetType: "organization",
  })
}

export async function findPublicViewContext(
  executor: Executor,
  record: OrganizationPublicViewRecord,
  leagueId: string
): Promise<PublicViewContext | null> {
  const league = (
    await executor
      .select({ id: leagues.id, name: leagues.name })
      .from(leagues)
      .where(
        and(
          eq(leagues.id, leagueId),
          eq(leagues.organizationId, record.organizationId)
        )
      )
      .limit(1)
  ).at(0)
  if (!league) return null
  const available = await findLeaguesForOrganization(
    executor,
    record.organizationId
  )
  return {
    organizationId: record.organizationId,
    organizationName: record.organizationName,
    organizationSlug: record.organizationSlug,
    organizationLogo: record.organizationLogo,
    brandColor: organizationBrandColorFromMetadata(record.organizationMetadata),
    leagueId: league.id,
    leagueName: league.name,
    leagues: available.map((candidate) => ({
      id: candidate.id,
      name: candidate.name,
    })),
  }
}

async function findOrganizationPublicView(
  executor: Executor,
  condition: ReturnType<typeof eq>
): Promise<OrganizationPublicViewRecord | null> {
  const row = (
    await executor
      .select({
        organizationId: organization.id,
        organizationName: organization.name,
        organizationSlug: organization.slug,
        organizationLogo: organization.logo,
        organizationMetadata: organization.metadata,
        enabled: organizationPublicViews.enabled,
        passwordHash: organizationPublicViews.passwordHash,
        credentialVersion: organizationPublicViews.credentialVersion,
      })
      .from(organization)
      .leftJoin(
        organizationPublicViews,
        eq(organizationPublicViews.organizationId, organization.id)
      )
      .where(condition)
      .limit(1)
  ).at(0)
  if (!row) return null
  return {
    ...row,
    enabled: row.enabled ?? false,
    passwordHash: row.passwordHash ?? null,
    credentialVersion: row.credentialVersion ?? 0,
  }
}

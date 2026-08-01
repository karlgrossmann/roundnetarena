import "@tanstack/react-start/server-only"

import { and, asc, desc, eq, gte } from "drizzle-orm"

import type {
  OrganizationDetails,
  OrganizationRole,
  OrganizationSummary,
} from "@/lib/types"
import { isOrganizationRole } from "@/lib/organization-permissions"

import { getDb } from "../db/client"
import type { Executor } from "../db/client"
import {
  toOrganizationInvitation,
  toOrganizationMember,
  toOrganizationSummary,
} from "../db/mappers"
import { invitation, member, organization, user } from "../db/auth-schema"
import { findLeaguesForOrganization } from "./leagues"
import { listOrganizationJoinLinks } from "./organization-join-links"
import { findOrganizationPublicViewSettings } from "./organization-public-view"

export interface OrganizationRecord {
  id: string
  name: string
  slug: string
  metadata: string | null
}

export interface OrganizationMembership {
  id: string
  role: OrganizationRole
}

export async function findOrganizationsForUser(
  executor: Executor = getDb(),
  userId: string,
  activeOrganizationId: string | null
): Promise<Array<OrganizationSummary>> {
  const rows = await executor
    .select({
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      logo: organization.logo,
      metadata: organization.metadata,
      role: member.role,
    })
    .from(member)
    .innerJoin(organization, eq(organization.id, member.organizationId))
    .where(eq(member.userId, userId))
    .orderBy(asc(organization.name))

  return Promise.all(
    rows.map(async (row) => {
      const defaultLeague = (
        await findLeaguesForOrganization(executor, row.id)
      ).at(0)
      return toOrganizationSummary({
        ...row,
        activeOrganizationId,
        leagueId: defaultLeague?.id ?? null,
      })
    })
  )
}

export async function findOrganizationMembership(
  executor: Executor = getDb(),
  organizationId: string,
  userId: string
): Promise<OrganizationMembership | null> {
  const row = (
    await executor
      .select({ id: member.id, role: member.role })
      .from(member)
      .where(
        and(
          eq(member.organizationId, organizationId),
          eq(member.userId, userId)
        )
      )
  ).at(0)
  if (!row || !isOrganizationRole(row.role)) return null
  return { id: row.id, role: row.role }
}

export async function findOrganizationRecord(
  executor: Executor = getDb(),
  organizationId: string
): Promise<OrganizationRecord | null> {
  return (
    (
      await executor
        .select({
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
          metadata: organization.metadata,
        })
        .from(organization)
        .where(eq(organization.id, organizationId))
    ).at(0) ?? null
  )
}

export async function findOrganizationDetails(
  executor: Executor = getDb(),
  organizationId: string,
  currentUserId: string,
  activeOrganizationId: string | null,
  now: Date
): Promise<OrganizationDetails | null> {
  const currentMembership = await findOrganizationMembership(
    executor,
    organizationId,
    currentUserId
  )
  if (!currentMembership) return null

  const organizationRow = (
    await executor
      .select({
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        logo: organization.logo,
        metadata: organization.metadata,
      })
      .from(organization)
      .where(eq(organization.id, organizationId))
  ).at(0)
  if (!organizationRow) return null
  const defaultLeague = (
    await findLeaguesForOrganization(executor, organizationId)
  ).at(0)

  const [memberRows, invitationRows, joinLinks, publicView] = await Promise.all(
    [
      executor
        .select({
          id: member.id,
          userId: member.userId,
          name: user.name,
          email: user.email,
          role: member.role,
          createdAt: member.createdAt,
        })
        .from(member)
        .innerJoin(user, eq(user.id, member.userId))
        .where(eq(member.organizationId, organizationId))
        .orderBy(asc(user.name)),
      executor
        .select({
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          status: invitation.status,
          expiresAt: invitation.expiresAt,
          createdAt: invitation.createdAt,
        })
        .from(invitation)
        .where(
          and(
            eq(invitation.organizationId, organizationId),
            gte(
              invitation.createdAt,
              new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)
            )
          )
        )
        .orderBy(desc(invitation.createdAt)),
      listOrganizationJoinLinks(executor, organizationId, now),
      currentMembership.role === "owner"
        ? findOrganizationPublicViewSettings(
            executor,
            organizationId,
            organizationRow.slug
          )
        : Promise.resolve(null),
    ]
  )

  return {
    organization: toOrganizationSummary({
      ...organizationRow,
      leagueId: defaultLeague?.id ?? null,
      role: currentMembership.role,
      activeOrganizationId,
    }),
    members: memberRows.map((row) => toOrganizationMember(row, currentUserId)),
    invitations: invitationRows.map((row) =>
      toOrganizationInvitation(row, now)
    ),
    joinLinks,
    publicView,
  }
}

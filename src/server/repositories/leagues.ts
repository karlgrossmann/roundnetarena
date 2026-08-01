import "@tanstack/react-start/server-only"

import { and, asc, countDistinct, eq, sql } from "drizzle-orm"

import type {
  LeagueContext,
  LeagueSummary,
  OrganizationRole,
} from "@/lib/types"

import type { Executor } from "../db/client"
import { gameBlocks, games, leagues, players } from "../db/schema"
import { member, organization } from "../db/auth-schema"

interface LeagueAccessRecord {
  league: LeagueSummary
  organizationName: string
  organizationSlug: string
  role: string
}

export async function findLeaguesForOrganization(
  executor: Executor,
  organizationId: string
): Promise<Array<LeagueSummary>> {
  const rows = await executor
    .select({
      id: leagues.id,
      organizationId: leagues.organizationId,
      name: leagues.name,
      createdAt: leagues.createdAt,
      playerCount: countDistinct(players.id),
      gameCount: sql<number>`count(distinct ${games.id}) filter (
        where ${gameBlocks.committed} and ${games.status} = 'played'
      )`,
    })
    .from(leagues)
    .leftJoin(
      players,
      and(eq(players.leagueId, leagues.id), eq(players.markedAsDeleted, false))
    )
    .leftJoin(gameBlocks, eq(gameBlocks.leagueId, leagues.id))
    .leftJoin(games, eq(games.blockId, gameBlocks.id))
    .where(eq(leagues.organizationId, organizationId))
    .groupBy(leagues.id)
    .orderBy(asc(leagues.createdAt), asc(leagues.name))

  return rows.map((row) => ({
    id: row.id,
    organizationId: row.organizationId,
    name: row.name,
    playerCount: Number(row.playerCount),
    gameCount: Number(row.gameCount),
    createdAt: row.createdAt.toISOString(),
  }))
}

export async function findLeagueAccess(
  executor: Executor,
  organizationId: string,
  leagueId: string,
  userId: string
): Promise<LeagueAccessRecord | null> {
  const row = (
    await executor
      .select({
        id: leagues.id,
        organizationId: leagues.organizationId,
        name: leagues.name,
        createdAt: leagues.createdAt,
        organizationName: organization.name,
        organizationSlug: organization.slug,
        role: member.role,
      })
      .from(leagues)
      .innerJoin(
        organization,
        and(
          eq(organization.id, leagues.organizationId),
          eq(organization.id, organizationId)
        )
      )
      .innerJoin(
        member,
        and(
          eq(member.organizationId, organization.id),
          eq(member.userId, userId)
        )
      )
      .where(
        and(
          eq(leagues.id, leagueId),
          eq(leagues.organizationId, organizationId)
        )
      )
  ).at(0)
  if (!row) return null

  const summary = (
    await findLeaguesForOrganization(executor, organizationId)
  ).find((league) => league.id === leagueId)
  if (!summary) return null

  return {
    league: summary,
    organizationName: row.organizationName,
    organizationSlug: row.organizationSlug,
    role: row.role,
  }
}

export async function insertLeague(
  executor: Executor,
  input: { id: string; organizationId: string; name: string }
): Promise<void> {
  try {
    await executor.insert(leagues).values(input)
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "constraint" in error &&
      error.constraint === "league_organization_name_uq"
    ) {
      throw new LeagueNameConstraintError()
    }
    throw error
  }
}

export class LeagueNameConstraintError extends Error {
  constructor() {
    super("league_organization_name_uq")
    this.name = "LeagueNameConstraintError"
  }
}

export function leagueContextFromAccess(
  access: LeagueAccessRecord,
  role: OrganizationRole,
  canManageLeague: boolean
): LeagueContext {
  return {
    ...access.league,
    leagueId: access.league.id,
    organizationName: access.organizationName,
    organizationSlug: access.organizationSlug,
    role,
    canManageLeague,
  }
}

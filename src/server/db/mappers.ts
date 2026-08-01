import type {
  GameStatus,
  MatchExplanation,
  MatchExplanationCriterion,
  MatchExplanationLineup,
  MatchingAlgorithm,
  OrganizationInvitation,
  OrganizationInvitationStatus,
  OrganizationMember,
  OrganizationRole,
  OrganizationSummary,
  Player,
  PlayerRef,
  PoolStatus,
  Settings,
  TableColumn,
} from "@/lib/types"
import { organizationBrandColorFromMetadata } from "@/lib/organization-brand"
import { isOrganizationRole } from "@/lib/organization-permissions"

const TABLE_COLUMNS: ReadonlyArray<TableColumn> = [
  "rating",
  "rd",
  "gamesPlayed",
  "gamesWon",
  "gamesLost",
  "winPercentage",
  "totalRatingChange",
]

export interface PlayerProjection {
  id: string
  firstName: string
  lastName: string
  rating: number
  rd: number
  gamesPlayed: number
  gamesWon: number
  gamesLost: number
  gamesPaused: number
  initialRating: number
}

export function toPlayer(row: PlayerProjection, displayName: string): Player {
  return {
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    displayName,
    rating: row.rating,
    rd: row.rd,
    gamesPlayed: row.gamesPlayed,
    gamesWon: row.gamesWon,
    gamesLost: row.gamesLost,
    gamesPaused: row.gamesPaused,
    totalRatingChange: row.rating - row.initialRating,
  }
}

export function toPlayerRef(player: Player): PlayerRef {
  return {
    id: player.id,
    displayName: player.displayName,
    rating: player.rating,
  }
}

export function toGameStatus(
  status: "proposed" | "played" | "cancelled"
): GameStatus {
  if (status === "proposed") return "open"
  if (status === "played") return "finished"
  return "cancelled"
}

export function fromGameStatus(
  status: GameStatus
): "proposed" | "played" | "cancelled" {
  if (status === "open") return "proposed"
  if (status === "finished") return "played"
  return "cancelled"
}

export function toMatchExplanation(
  value: unknown
): MatchExplanation | undefined {
  if (!isRecord(value) || value.version !== 1 || value.matcher !== "default") {
    return undefined
  }
  const chosen = toExplanationLineup(value.chosen, "chosen")
  if (!chosen || !Array.isArray(value.alternatives)) return undefined

  const alternatives = value.alternatives.flatMap((candidate) => {
    if (!isRecord(candidate) || !isExplanationCriterion(candidate.id)) {
      return []
    }
    const lineup = toExplanationLineup(candidate, candidate.id)
    if (
      !lineup ||
      !hasSamePlayers(lineup, chosen) ||
      typeof candidate.costDelta !== "number" ||
      !Number.isFinite(candidate.costDelta) ||
      candidate.costDelta < 0 ||
      Math.abs(lineup.cost - chosen.cost - candidate.costDelta) > 1e-7
    ) {
      return []
    }
    return [{ ...lineup, id: candidate.id, costDelta: candidate.costDelta }]
  })
  if (alternatives.length !== value.alternatives.length) return undefined
  if (
    new Set(alternatives.map((alternative) => alternative.id)).size !==
    alternatives.length
  ) {
    return undefined
  }

  return {
    version: 1,
    matcher: "default",
    chosen,
    alternatives,
  }
}

export function toPoolStatus(
  status: "active" | "paused" | "absent"
): PoolStatus {
  if (status === "active") return "playing"
  return status
}

export function fromPoolStatus(
  status: PoolStatus
): "active" | "paused" | "absent" {
  return status === "playing" ? "active" : status
}

export function toSettings(row: {
  matchingAlgorithm: string
  higherRatingWeight: number
  pauseMode: string
  initialRating: number
  initialRd: number
  tableColumns: Array<string>
  tableSortBy: string
  tableColoring: boolean
}): Settings {
  const columns = row.tableColumns.filter(isTableColumn)
  const sortBy = isTableColumn(row.tableSortBy)
    ? row.tableSortBy
    : (columns[0] ?? "rating")

  return {
    matchingAlgorithm: isMatchingAlgorithm(row.matchingAlgorithm)
      ? row.matchingAlgorithm
      : "default",
    higherRatingWeight: row.higherRatingWeight,
    pauseMode: row.pauseMode === "lowest_first" ? "lowest_first" : "random",
    initialRating: row.initialRating,
    initialRd: row.initialRd,
    table: {
      columns,
      sortBy,
      colorRatingChange: row.tableColoring,
    },
  }
}

export function toOrganizationSummary(row: {
  id: string
  name: string
  slug: string
  logo: string | null
  metadata?: unknown
  role: string
  activeOrganizationId: string | null
  leagueId: string | null
}): OrganizationSummary {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    logo: row.logo,
    brandColor: organizationBrandColorFromMetadata(row.metadata),
    role: toOrganizationRole(row.role),
    isActive: row.id === row.activeOrganizationId,
    provisioned: row.leagueId !== null,
    defaultLeagueId: row.leagueId,
  }
}

export function toOrganizationMember(
  row: {
    id: string
    userId: string
    name: string
    email: string
    role: string
    createdAt: Date
  },
  currentUserId: string
): OrganizationMember {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    email: row.email,
    role: toOrganizationRole(row.role),
    joinedAt: row.createdAt.toISOString(),
    isCurrentUser: row.userId === currentUserId,
  }
}

export function toOrganizationInvitation(
  row: {
    id: string
    email: string
    role: string | null
    status: string
    expiresAt: Date
    createdAt: Date
  },
  now: Date
): OrganizationInvitation {
  return {
    id: row.id,
    email: row.email,
    role: toOrganizationRole(row.role ?? ""),
    status: toOrganizationInvitationStatus(row.status, row.expiresAt, now),
    expiresAt: row.expiresAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  }
}

function toOrganizationRole(value: string): OrganizationRole {
  if (isOrganizationRole(value)) return value
  throw new Error("Unknown static organization role in the database.")
}

function toOrganizationInvitationStatus(
  status: string,
  expiresAt: Date,
  now: Date
): OrganizationInvitationStatus {
  if (status === "pending" && expiresAt <= now) return "expired"
  if (
    status === "pending" ||
    status === "accepted" ||
    status === "rejected" ||
    status === "canceled"
  ) {
    return status
  }
  throw new Error("Unknown invitation status in the database.")
}

/** Unique display names, matching the Python function `generate_*uniquename_map`. */
export function displayNames(
  rows: Array<{ id: string; firstName: string; lastName: string }>
): Map<string, string> {
  const result = new Map<string, string>()

  rows.forEach((row) => {
    const sameFirstName = rows.filter(
      (candidate) => candidate.firstName === row.firstName
    )
    if (!row.lastName) {
      result.set(
        row.id,
        sameFirstName.length === 1
          ? row.firstName
          : `${row.firstName} (${row.id.slice(-4)})`
      )
      return
    }

    let length = 1
    while (
      length < row.lastName.length &&
      sameFirstName.some(
        (candidate) =>
          candidate.id !== row.id &&
          candidate.lastName
            .slice(0, length)
            .localeCompare(row.lastName.slice(0, length), "de", {
              sensitivity: "base",
            }) === 0
      )
    ) {
      length += 1
    }
    const suffix = row.lastName.slice(0, length)
    result.set(row.id, `${row.firstName} ${suffix}.`)
  })

  return result
}

function isTableColumn(value: string): value is TableColumn {
  return TABLE_COLUMNS.includes(value as TableColumn)
}

function isMatchingAlgorithm(value: string): value is MatchingAlgorithm {
  return value === "default" || value === "random"
}

function toExplanationLineup<TId extends "chosen" | MatchExplanationCriterion>(
  value: unknown,
  id: TId
): (MatchExplanationLineup & { id: TId }) | undefined {
  if (
    !isRecord(value) ||
    value.id !== id ||
    typeof value.cost !== "number" ||
    !Number.isFinite(value.cost) ||
    value.cost < 0 ||
    !Array.isArray(value.matchups) ||
    value.matchups.length === 0
  ) {
    return undefined
  }
  const matchups = value.matchups.flatMap((matchup) => {
    if (
      !isRecord(matchup) ||
      !isPlayerPair(matchup.teamA) ||
      !isPlayerPair(matchup.teamB)
    ) {
      return []
    }
    return [{ teamA: matchup.teamA, teamB: matchup.teamB }]
  })
  if (matchups.length !== value.matchups.length) return undefined
  const playerIds = matchups.flatMap((matchup) => [
    ...matchup.teamA,
    ...matchup.teamB,
  ])
  if (new Set(playerIds).size !== playerIds.length) return undefined
  return { id, matchups, cost: value.cost }
}

function hasSamePlayers(
  first: MatchExplanationLineup,
  second: MatchExplanationLineup
): boolean {
  const firstIds = first.matchups.flatMap((matchup) => [
    ...matchup.teamA,
    ...matchup.teamB,
  ])
  const secondIds = new Set(
    second.matchups.flatMap((matchup) => [...matchup.teamA, ...matchup.teamB])
  )
  return (
    firstIds.length === secondIds.size &&
    firstIds.every((playerId) => secondIds.has(playerId))
  )
}

function isPlayerPair(value: unknown): value is [string, string] {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    value.every(
      (playerId) => typeof playerId === "string" && playerId.length > 0
    )
  )
}

function isExplanationCriterion(
  value: unknown
): value is MatchExplanationCriterion {
  return (
    value === "ratingRange" ||
    value === "teamDifference" ||
    value === "repeatedPlayers"
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

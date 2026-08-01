/**
 * Domain types of the matchmaking app.
 *
 * Derived from the Python dataclasses in `dao.py`, but deliberately not congruent: the
 * backend stores relations as id references (a game points at four rating snapshots,
 * which in turn point at players). For the UI these references are already resolved —
 * a view must never have to fetch again just to show a name.
 *
 * This file is the single source of truth for data shapes. Neither mock data nor
 * components define their own variants of them.
 */

import type { OrganizationBrandColor } from "./organization-brand"

export type PlayerId = string
export type RoundId = string
export type GameId = string

/** Moments as ISO-8601 strings. The backend delivers Unix seconds; the conversion
 *  happens at the API boundary, not in components. */
export type IsoDateTime = string

// ---------------------------------------------------------------------------
// Players
// ---------------------------------------------------------------------------

export interface Player {
  id: PlayerId
  firstName: string
  lastName: string
  /** Display name, made unique by the backend: "Klara N." — on a name clash
   *  "Klara No." and so on. Always show this value, never assemble one yourself. */
  displayName: string
  /** Current Glicko-2 rating, rounded. */
  rating: number
  /** Rating deviation: the rating's uncertainty. High for new players (starting at
   *  125), dropping with every game played. */
  rd: number
  gamesPlayed: number
  gamesWon: number
  gamesLost: number
  gamesPaused: number
  /** Sum of all rating changes since creation. */
  totalRatingChange: number
}

/** Minimal player shape for leaderboards. Raw personal fields such as first and last
 * name never cross the public server boundary. */
export type LeaderboardPlayer = Pick<
  Player,
  | "id"
  | "displayName"
  | "rating"
  | "rd"
  | "gamesPlayed"
  | "gamesWon"
  | "gamesLost"
  | "gamesPaused"
  | "totalRatingChange"
>

/** One point in a player's rating history. */
export interface RatingPoint {
  timestamp: IsoDateTime
  rating: number
  rd: number
}

/** A game from a single player's perspective — for the game history on the player
 *  page. */
export interface PlayerGame {
  gameId: GameId
  timestamp: IsoDateTime
  partner: PlayerRef
  opponents: [PlayerRef, PlayerRef]
  /** Points from the viewed player's perspective. */
  ownPoints: number
  opponentPoints: number
  won: boolean
  ratingBefore: number
  ratingAfter: number
}

/** Lean player reference wherever only name and rating are needed. */
export interface PlayerRef {
  id: PlayerId
  displayName: string
  /**
   * Set once the personal name data was irreversibly removed. The visible label is
   * derived from it and is not stored in the database.
   */
  anonymizedKey?: string
  rating: number
}

// ---------------------------------------------------------------------------
// Pool — who is here today
// ---------------------------------------------------------------------------

/**
 * A player's status in the pool.
 * - `playing`  — takes part in the next round
 * - `paused`   — voluntary break, stays visible, is not assigned
 * - `absent`   — not here today
 *
 * An algorithmically assigned rest is *not* a pool status: it applies to one round
 * only and lives in `Round.pausing`.
 */
export type PoolStatus = "playing" | "paused" | "absent"

export interface PoolEntry {
  player: PlayerRef
  status: PoolStatus
}

export interface FixedTeam {
  id: string
  players: [PlayerId, PlayerId]
}

export interface Pool {
  /** Time of the last change. Once the pool is older than 3 hours, the UI asks whether
   *  it should be reused. */
  updatedAt: IsoDateTime
  entries: Array<PoolEntry>
  /** Stored pairs. Only teams with two players present are currently active. */
  fixedTeams: Array<FixedTeam>
}

// ---------------------------------------------------------------------------
// Pause preview
// ---------------------------------------------------------------------------

/**
 * One row of the "who would sit out?" preview. Sorted ascending by `pauseQuota`; on a
 * tie either chance or the lowest rating decides, depending on the setting.
 */
export interface PauseCandidate {
  player: PlayerRef
  gamesPlayedToday: number
  gamesPausedToday: number
  /** Ratio of paused to played. Low = sits out next. */
  pauseQuota: number
  /** Would sit out at the current court count. */
  willPause: boolean
}

// ---------------------------------------------------------------------------
// Rounds and games
// ---------------------------------------------------------------------------

export type RoundStatus = "active" | "committed"

/**
 * Status of a single game within a round.
 * - `open`      — still running, no result recorded
 * - `finished`  — result recorded, but not yet scored
 * - `cancelled` — cancelled, does not count towards scoring
 */
export type GameStatus = "open" | "finished" | "cancelled"

export interface Team {
  players: [PlayerRef, PlayerRef]
}

export interface Game {
  id: GameId
  /** Court number, 1-based — in the backend the local index within the round. */
  court: number
  status: GameStatus
  teamA: Team
  teamB: Team
  /** Only set when `status === "finished"`. */
  result?: GameResult
}

export interface GameResult {
  pointsA: number
  pointsB: number
  /**
   * Rating change per player.
   *
   * As long as the round is not committed these are **preview values**: recalculated
   * and stored nowhere yet. They only become binding when the round is committed, and
   * the UI has to make that difference visible.
   */
  ratingChanges: Array<RatingChange>
}

export interface RatingChange {
  player: PlayerRef
  ratingBefore: number
  ratingAfter: number
  /** `ratingAfter - ratingBefore`, signed. */
  delta: number
}

export interface Round {
  id: RoundId
  /** Consecutive number within the session day, 1-based. */
  number: number
  startedAt: IsoDateTime
  status: RoundStatus
  games: Array<Game>
  /** Who sits this round out — algorithmically assigned and voluntarily pausing. */
  pausing: Array<PausingPlayer>
  /** The matcher's explanation: why these matchups and not others. */
  explanation?: MatchExplanation
}

export interface PausingPlayer {
  player: PlayerRef
  /** `voluntary` = self-chosen, `assigned` = assigned by the algorithm. */
  reason: "voluntary" | "assigned"
}

/**
 * The chosen lineup set against the discarded alternatives. Lower cost is better;
 * `costDelta` is the surcharge relative to the chosen solution.
 */
export interface MatchExplanation {
  /** Versioned, language-neutral persistence form. */
  version: 1
  /** Counterfactual analyses only hold for the exact default matcher. */
  matcher: "default"
  chosen: MatchExplanationLineup & { id: "chosen" }
  alternatives: Array<
    MatchExplanationLineup & {
      /** Cost component this counter-lineup deliberately improves. */
      id: MatchExplanationCriterion
      /** `cost - chosen.cost`, unrounded. */
      costDelta: number
    }
  >
}

export type MatchExplanationCriterion =
  "ratingRange" | "teamDifference" | "repeatedPlayers"

export interface MatchExplanationLineup {
  matchups: Array<{
    teamA: [PlayerId, PlayerId]
    teamB: [PlayerId, PlayerId]
  }>
  cost: number
}

// ---------------------------------------------------------------------------
// History
// ---------------------------------------------------------------------------

/** A session day: every round of one day, grouped. */
export interface SessionDay {
  /** Calendar day in YYYY-MM-DD format. */
  date: string
  rounds: Array<RoundSummary>
}

export interface RoundSummary {
  id: RoundId
  number: number
  startedAt: IsoDateTime
  status: RoundStatus
  gameCount: number
  cancelledCount: number
  playerCount: number
  pausingCount: number
}

// ---------------------------------------------------------------------------
// Dashboard and settings
// ---------------------------------------------------------------------------

export interface DashboardSummary {
  playerCount: number
  gamesTotal: number
  gamesToday: number
  sessionCount: number
  /** Set as long as a round is not committed. */
  activeRound?: {
    id: RoundId
    number: number
    openGames: number
    totalGames: number
  }
}

/** Columns that can be shown in the table. Matches
 *  `TABLE_COLUMN_PLAYER_ATTRIBUTE_MAPPING` in the backend. */
export type TableColumn =
  | "rating"
  | "rd"
  | "gamesPlayed"
  | "gamesWon"
  | "gamesLost"
  | "winPercentage"
  | "totalRatingChange"

export interface TableConfig {
  columns: Array<TableColumn>
  sortBy: TableColumn
  /** Color the rating change green/red. */
  colorRatingChange: boolean
}

export type MatchingAlgorithm = "default" | "random"

/** Decides who sits out when several players have paused equally often. */
export type PauseMode = "random" | "lowest_first"

export interface Settings {
  matchingAlgorithm: MatchingAlgorithm
  /** Weight of stronger players during optimization. Higher = more balanced top teams.
   *  Backend default 2.0. */
  higherRatingWeight: number
  pauseMode: PauseMode
  initialRating: number
  initialRd: number
  table: TableConfig
}

export interface LeagueSummary {
  id: string
  organizationId: string
  name: string
  playerCount: number
  gameCount: number
  createdAt: IsoDateTime
}

export interface LeagueContext extends LeagueSummary {
  leagueId: string
  organizationName: string
  organizationSlug: string
  role: OrganizationRole
  canManageLeague: boolean
}

export interface PublicViewLeagueSummary {
  id: string
  name: string
}

export interface PublicViewContext {
  organizationId: string
  organizationName: string
  organizationSlug: string
  organizationLogo: string | null
  brandColor: OrganizationBrandColor
  leagueId: string
  leagueName: string
  leagues: Array<PublicViewLeagueSummary>
}

export interface PublicViewEntry {
  organizationName: string
  organizationSlug: string
  organizationLogo: string | null
  brandColor: OrganizationBrandColor
  defaultLeagueId: string
}

export interface PublicViewDashboard {
  summary: DashboardSummary
  players: Array<LeaderboardPlayer>
  activePoolPlayerIds: Array<PlayerId>
  table: TableConfig
}

export interface OrganizationPublicViewSettings {
  enabled: boolean
  hasPassword: boolean
  accessPath: string
}

// ---------------------------------------------------------------------------
// Account
// ---------------------------------------------------------------------------

export interface AccountDetails {
  name: string
  email: string
}

// ---------------------------------------------------------------------------
// Clubs and memberships
// ---------------------------------------------------------------------------

export type OrganizationRole = "owner" | "admin" | "manager"

export interface OrganizationSummary {
  id: string
  name: string
  slug: string
  logo: string | null
  brandColor: OrganizationBrandColor
  role: OrganizationRole
  isActive: boolean
  provisioned: boolean
  defaultLeagueId: string | null
}

export interface OrganizationMember {
  id: string
  userId: string
  name: string
  email: string
  role: OrganizationRole
  joinedAt: IsoDateTime
  isCurrentUser: boolean
}

export type OrganizationInvitationStatus =
  "pending" | "accepted" | "rejected" | "canceled" | "expired"

export interface OrganizationInvitation {
  id: string
  email: string
  role: OrganizationRole
  status: OrganizationInvitationStatus
  expiresAt: IsoDateTime
  createdAt: IsoDateTime
}

export interface OrganizationDetails {
  organization: OrganizationSummary
  members: Array<OrganizationMember>
  invitations: Array<OrganizationInvitation>
  joinLinks: Array<OrganizationJoinLink>
  publicView: OrganizationPublicViewSettings | null
}

export interface InvitationDetails {
  id: string
  organizationId: string
  organizationName: string
  organizationSlug: string
  inviterEmail: string
  email: string
  role: OrganizationRole
  expiresAt: IsoDateTime
}

export type OrganizationJoinLinkStatus =
  "active" | "expired" | "exhausted" | "revoked"

export interface OrganizationJoinLink {
  id: string
  role: "manager"
  expiresAt: IsoDateTime
  maxUses: number
  usedCount: number
  status: OrganizationJoinLinkStatus
  createdAt: IsoDateTime
}

export type OrganizationJoinLinkPublicStatus =
  "valid" | "invalid" | "expired" | "exhausted" | "revoked" | "rate_limited"

export interface OrganizationJoinLinkPreview {
  status: OrganizationJoinLinkPublicStatus
  organizationName?: string
  role?: "manager"
  expiresAt?: IsoDateTime
  remainingUses?: number
}

export interface CreatedOrganizationJoinLink {
  link: OrganizationJoinLink
  url: string
}

export interface OrganizationJoinLinkAcceptance {
  organizationId: string
  organizationSlug: string
  organizationName: string
  alreadyMember: boolean
}

export interface OrganizationAuditActor {
  id: string
  name: string
}

export type OrganizationAuditEventType =
  | "organization.member_role_changed"
  | "organization.ownership_changed"
  | "organization.member_removed"
  | "organization.invitation_created"
  | "organization.invitation_resent"
  | "organization.invitation_revoked"
  | "organization.invitation_accepted"
  | "organization.join_link_created"
  | "organization.join_link_revoked"
  | "organization.join_link_accepted"
  | "organization.public_view_enabled"
  | "organization.public_view_disabled"
  | "organization.public_view_password_changed"
  | "organization.archived"

export type OrganizationAuditTargetType =
  "organization" | "member" | "invitation" | "join_link"

export interface OrganizationAuditMetadataByEvent {
  "organization.member_role_changed": {
    previousRole: OrganizationRole
    newRole: OrganizationRole
  }
  "organization.ownership_changed": {
    previousRole: OrganizationRole
    newRole: OrganizationRole
  }
  "organization.member_removed": {
    role: OrganizationRole
  }
  "organization.invitation_created": {
    role: OrganizationRole
  }
  "organization.invitation_resent": {
    role: OrganizationRole
  }
  "organization.invitation_revoked": {
    role: OrganizationRole
  }
  "organization.invitation_accepted": {
    role: OrganizationRole
  }
  "organization.join_link_created": {
    role: "manager"
    maxUses: number
    expiresAt: string
  }
  "organization.join_link_revoked": Record<string, never>
  "organization.join_link_accepted": {
    role: "manager"
  }
  "organization.public_view_enabled": Record<string, never>
  "organization.public_view_disabled": Record<string, never>
  "organization.public_view_password_changed": Record<string, never>
  "organization.archived": Record<string, never>
}

export type OrganizationAuditMetadata =
  OrganizationAuditMetadataByEvent[OrganizationAuditEventType]

export interface OrganizationAuditEntry {
  id: string
  eventType: OrganizationAuditEventType
  actor: OrganizationAuditActor | null
  targetType: OrganizationAuditTargetType
  targetId: string
  metadata: OrganizationAuditMetadata
  createdAt: IsoDateTime
}

export interface OrganizationAuditPage {
  items: Array<OrganizationAuditEntry>
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

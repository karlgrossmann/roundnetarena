import { sql } from "drizzle-orm"
import {
  bigint,
  bigserial,
  boolean,
  char,
  check,
  doublePrecision,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  pgView,
  primaryKey,
  smallint,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core"

import { ORGANIZATION_AUDIT_EVENT_TYPES } from "@/lib/organization-audit"
import type { OrganizationAuditMetadata } from "@/lib/types"

import { organization, user } from "./auth-schema"

const tstz = (name: string) => timestamp(name, { withTimezone: true })

export const organizationJoinLinks = pgTable(
  "organization_join_link",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    role: text("role").notNull().default("manager"),
    expiresAt: tstz("expires_at").notNull(),
    maxUses: integer("max_uses").notNull(),
    usedCount: integer("used_count").notNull().default(0),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => user.id),
    revokedAt: tstz("revoked_at"),
    createdAt: tstz("created_at").notNull().defaultNow(),
  },
  (table) => [
    unique("organization_join_link_token_hash_uq").on(table.tokenHash),
    index("organization_join_link_organization_idx").on(
      table.organizationId,
      table.createdAt
    ),
    check(
      "organization_join_link_standard_role",
      sql`${table.role} = 'manager'`
    ),
    check(
      "organization_join_link_max_uses_positive",
      sql`${table.maxUses} > 0`
    ),
    check(
      "organization_join_link_used_count_valid",
      sql`${table.usedCount} >= 0 and ${table.usedCount} <= ${table.maxUses}`
    ),
  ]
)

export const organizationPublicViews = pgTable(
  "organization_public_view",
  {
    organizationId: uuid("organization_id")
      .primaryKey()
      .references(() => organization.id, { onDelete: "cascade" }),
    enabled: boolean("enabled").notNull().default(false),
    passwordHash: text("password_hash"),
    credentialVersion: integer("credential_version").notNull().default(0),
    updatedAt: tstz("updated_at").notNull().defaultNow(),
  },
  (table) => [
    check(
      "organization_public_view_password_when_enabled",
      sql`not ${table.enabled} or ${table.passwordHash} is not null`
    ),
    check(
      "organization_public_view_credential_version_non_negative",
      sql`${table.credentialVersion} >= 0`
    ),
  ]
)

export const organizationAuditLogs = pgTable(
  "organization_audit_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id),
    actorUserId: uuid("actor_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    eventType: text("event_type").notNull(),
    targetType: text("target_type").notNull(),
    targetId: uuid("target_id").notNull(),
    metadata: jsonb("metadata")
      .$type<OrganizationAuditMetadata>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: tstz("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("organization_audit_log_organization_idx").on(
      table.organizationId,
      table.createdAt.desc(),
      table.id.desc()
    ),
    check(
      "organization_audit_log_event_type",
      sql`${table.eventType} in (${sql.raw(
        ORGANIZATION_AUDIT_EVENT_TYPES.map(
          (eventType) => `'${eventType}'`
        ).join(", ")
      )})`
    ),
    check(
      "organization_audit_log_target_type",
      sql`${table.targetType} in ('organization', 'member', 'invitation', 'join_link')`
    ),
    check(
      "organization_audit_log_metadata_object",
      sql`jsonb_typeof(${table.metadata}) = 'object'`
    ),
  ]
)

export const leagues = pgTable(
  "league",
  {
    id: text("league_id").primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdAt: tstz("created_at").notNull().defaultNow(),
  },
  (table) => [
    unique("league_organization_name_uq").on(table.organizationId, table.name),
    index("league_organization_idx").on(table.organizationId, table.createdAt),
  ]
)

export const players = pgTable(
  "player",
  {
    id: text("player_id").primaryKey(),
    leagueId: text("league_id")
      .notNull()
      .references(() => leagues.id),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull().default(""),
    markedAsDeleted: boolean("marked_as_deleted").notNull().default(false),
    anonymizedKey: text("anonymized_key"),
    createdAt: tstz("created_at").notNull().defaultNow(),
  },
  (table) => [
    unique("player_league_uq").on(table.id, table.leagueId),
    unique("player_anonymized_key_uq").on(table.anonymizedKey),
    check(
      "player_identity_state",
      sql`(
        not ${table.markedAsDeleted}
        and ${table.anonymizedKey} is null
        and btrim(${table.firstName}) <> ''
      ) or (
        ${table.markedAsDeleted}
        and ${table.anonymizedKey} is not null
        and ${table.firstName} = ''
        and ${table.lastName} = ''
      )`
    ),
    uniqueIndex("player_active_name_uq")
      .on(
        table.leagueId,
        sql`lower(regexp_replace(btrim(${table.firstName}), '[[:space:]]+', ' ', 'g'))`,
        sql`lower(regexp_replace(btrim(${table.lastName}), '[[:space:]]+', ' ', 'g'))`
      )
      .where(sql`not ${table.markedAsDeleted}`),
    index("player_active_idx")
      .on(table.leagueId)
      .where(sql`not ${table.markedAsDeleted}`),
  ]
)

export const gameBlocks = pgTable(
  "game_block",
  {
    id: text("block_id").primaryKey(),
    seq: bigserial("seq", { mode: "number" }).notNull(),
    leagueId: text("league_id")
      .notNull()
      .references(() => leagues.id),
    committed: boolean("committed").notNull().default(false),
    explanation: jsonb("explanation"),
    createdAt: tstz("created_at").notNull().defaultNow(),
  },
  (table) => [
    unique("block_league_uq").on(table.id, table.leagueId),
    index("block_recent_idx").on(table.leagueId, table.createdAt.desc()),
    uniqueIndex("block_one_active_uq")
      .on(table.leagueId)
      .where(sql`not ${table.committed}`),
  ]
)

export const games = pgTable(
  "game",
  {
    id: text("game_id").primaryKey(),
    blockId: text("block_id").notNull(),
    leagueId: text("league_id").notNull(),
    localIdx: integer("local_idx").notNull(),
    status: text("status", {
      enum: ["proposed", "played", "cancelled"],
    }).notNull(),
    pointsA: integer("points_a"),
    pointsB: integer("points_b"),
    importance: doublePrecision("importance").notNull().default(1.5),
    createdAt: tstz("created_at").notNull().defaultNow(),
    playedAt: tstz("played_at"),
  },
  (table) => [
    unique("game_league_uq").on(table.id, table.leagueId),
    unique("game_court_uq").on(table.blockId, table.localIdx),
    foreignKey({
      columns: [table.blockId, table.leagueId],
      foreignColumns: [gameBlocks.id, gameBlocks.leagueId],
    }),
    check("game_local_idx_positive", sql`${table.localIdx} > 0`),
    check(
      "game_points_iff_played",
      sql`(${table.pointsA} is null) = (${table.pointsB} is null)
        and (
          (${table.status} = 'played' and ${table.pointsA} is not null)
          or ${table.status} = 'cancelled'
          or (${table.status} = 'proposed' and ${table.pointsA} is null)
        )`
    ),
    check(
      "game_points_valid",
      sql`${table.pointsA} is null or (${table.pointsA} >= 0 and ${table.pointsB} >= 0 and ${table.pointsA} <> ${table.pointsB})`
    ),
  ]
)

export const ratingSnapshots = pgTable(
  "rating_snapshot",
  {
    id: text("rating_snapshot_id").primaryKey(),
    seq: bigserial("seq", { mode: "number" }).notNull(),
    playerId: text("player_id").notNull(),
    leagueId: text("league_id").notNull(),
    gameId: text("game_id"),
    rating: integer("rating").notNull(),
    rd: doublePrecision("rd").notNull(),
    vol: doublePrecision("vol").notNull(),
    createdAt: tstz("created_at").notNull().defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.playerId, table.leagueId],
      foreignColumns: [players.id, players.leagueId],
    }),
    foreignKey({
      columns: [table.gameId, table.leagueId],
      foreignColumns: [games.id, games.leagueId],
    }),
    unique("snapshot_player_game_uq").on(table.playerId, table.gameId),
    uniqueIndex("snapshot_initial_uq")
      .on(table.playerId)
      .where(sql`${table.gameId} is null`),
    index("snapshot_latest_idx").on(table.playerId, table.seq.desc()),
  ]
)

export const gameParticipations = pgTable(
  "game_participation",
  {
    gameId: text("game_id").notNull(),
    playerId: text("player_id").notNull(),
    leagueId: text("league_id").notNull(),
    team: char("team", { length: 1, enum: ["a", "b"] }).notNull(),
    slot: smallint("slot").notNull(),
    ratingSnapshotId: text("rating_snapshot_id")
      .notNull()
      .references(() => ratingSnapshots.id),
  },
  (table) => [
    primaryKey({ columns: [table.gameId, table.playerId] }),
    unique("participation_seat_uq").on(table.gameId, table.team, table.slot),
    foreignKey({
      columns: [table.gameId, table.leagueId],
      foreignColumns: [games.id, games.leagueId],
    }),
    foreignKey({
      columns: [table.playerId, table.leagueId],
      foreignColumns: [players.id, players.leagueId],
    }),
    check("participation_slot", sql`${table.slot} in (1, 2)`),
    index("participation_player_idx").on(table.playerId),
  ]
)

export const blockPauses = pgTable(
  "block_pause",
  {
    blockId: text("block_id").notNull(),
    playerId: text("player_id").notNull(),
    leagueId: text("league_id").notNull(),
    reason: text("reason", { enum: ["assigned", "voluntary"] }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.blockId, table.playerId] }),
    foreignKey({
      columns: [table.blockId, table.leagueId],
      foreignColumns: [gameBlocks.id, gameBlocks.leagueId],
    }),
    foreignKey({
      columns: [table.playerId, table.leagueId],
      foreignColumns: [players.id, players.leagueId],
    }),
  ]
)

export const playerPools = pgTable("player_pool", {
  leagueId: text("league_id")
    .primaryKey()
    .references(() => leagues.id),
  updatedAt: tstz("updated_at").notNull().defaultNow(),
})

export const playerPoolMembers = pgTable(
  "player_pool_member",
  {
    leagueId: text("league_id")
      .notNull()
      .references(() => playerPools.leagueId),
    playerId: text("player_id").notNull(),
    status: text("status", {
      enum: ["active", "paused", "absent"],
    }).notNull(),
    fixedTeamKey: text("fixed_team_key"),
  },
  (table) => [
    primaryKey({ columns: [table.leagueId, table.playerId] }),
    foreignKey({
      columns: [table.playerId, table.leagueId],
      foreignColumns: [players.id, players.leagueId],
    }),
    index("pool_fixed_team_idx")
      .on(table.leagueId, table.fixedTeamKey)
      .where(sql`${table.fixedTeamKey} is not null`),
  ]
)

export const leagueSettings = pgTable("league_settings", {
  leagueId: text("league_id")
    .primaryKey()
    .references(() => leagues.id),
  matchingAlgorithm: text("matching_algorithm", {
    enum: ["default", "random"],
  })
    .notNull()
    .default("default"),
  higherRatingWeight: doublePrecision("higher_rating_weight")
    .notNull()
    .default(2),
  pauseMode: text("pause_mode", { enum: ["random", "lowest_first"] })
    .notNull()
    .default("random"),
  initialRating: integer("initial_rating").notNull().default(1500),
  initialRd: integer("initial_rd").notNull().default(125),
  tableColumns: text("table_columns").array().notNull(),
  tableSortBy: text("table_sort_by").notNull(),
  tableColoring: boolean("table_coloring").notNull().default(false),
})

export const playerCurrentRatings = pgView("player_current_rating", {
  playerId: text("player_id").notNull(),
  leagueId: text("league_id").notNull(),
  ratingSnapshotId: text("rating_snapshot_id").notNull(),
  rating: integer("rating").notNull(),
  rd: doublePrecision("rd").notNull(),
  vol: doublePrecision("vol").notNull(),
  createdAt: tstz("created_at").notNull(),
}).existing()

export const playerStats = pgView("player_stats", {
  playerId: text("player_id").notNull(),
  leagueId: text("league_id").notNull(),
  gamesPlayed: bigint("games_played", { mode: "number" }).notNull(),
  gamesWon: bigint("games_won", { mode: "number" }).notNull(),
  gamesLost: bigint("games_lost", { mode: "number" }).notNull(),
  gamesPaused: bigint("games_paused", { mode: "number" }).notNull(),
}).existing()

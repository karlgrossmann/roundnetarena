import { queryOptions } from "@tanstack/react-query"

import { timeRangeKey } from "../time-range"
import type { TimeRange } from "../time-range"
import type { LeagueContext, PlayerId } from "../types"
import { organizationJoinLinkCacheKey } from "../organization-join-links"
import { fetchAccount } from "@/server/functions/account"
import { fetchLeagueContext, fetchLeagues } from "@/server/functions/leagues"
import {
  fetchOrganization,
  fetchOrganizationInvitation,
  fetchOrganizations,
} from "@/server/functions/organizations"
import { inspectOrganizationJoinLink } from "@/server/functions/organization-join-links"
import { fetchOrganizationAuditPage } from "@/server/functions/organization-audit"
import {
  fetchActiveRound,
  fetchHistory,
  fetchPausePreview,
  fetchPlayer,
  fetchPlayerGames,
  fetchPlayerRemovalPreview,
  fetchPlayerRatingHistory,
  fetchPlayers,
  fetchPool,
  fetchSettings,
  fetchSummary,
} from "@/server/functions/read"
import {
  fetchPublicViewActiveRound,
  fetchPublicViewContext,
  fetchPublicViewDashboard,
  fetchPublicViewEntry,
  fetchPublicViewHistory,
} from "@/server/functions/public-view"

export interface LeagueRef {
  organizationId: string
  leagueId: string
}

export interface PublicViewRef {
  organizationSlug: string
  leagueId: string
}

const leagueRoot = (league: LeagueRef) =>
  ["organizations", league.organizationId, "leagues", league.leagueId] as const

export const queryKeys = {
  account: ["account"] as const,
  organizations: ["organizations"] as const,
  organization: (organizationId: string) =>
    ["organizations", organizationId] as const,
  organizationAuditRoot: (organizationId: string) =>
    ["organizations", organizationId, "audit"] as const,
  organizationAudit: (organizationId: string, page: number) =>
    [...queryKeys.organizationAuditRoot(organizationId), page] as const,
  organizationInvitation: (invitationId: string) =>
    ["organization-invitations", invitationId] as const,
  organizationJoinLink: (token: string) =>
    ["organization-join-links", organizationJoinLinkCacheKey(token)] as const,
  leagues: (organizationId: string) =>
    ["organizations", organizationId, "leagues"] as const,
  leagueContext: (
    organizationId: string,
    organizationSlug: string,
    leagueId: string
  ) =>
    [
      "organizations",
      organizationId,
      organizationSlug,
      "leagues",
      leagueId,
      "context",
    ] as const,
  summary: (league: LeagueRef) => [...leagueRoot(league), "summary"] as const,
  players: (league: LeagueRef) => [...leagueRoot(league), "players"] as const,
  player: (league: LeagueRef, id: PlayerId) =>
    [...leagueRoot(league), "players", id] as const,
  playerRatingHistory: (league: LeagueRef, id: PlayerId, range: TimeRange) =>
    [
      ...leagueRoot(league),
      "players",
      id,
      "ratings",
      ...timeRangeKey(range),
    ] as const,
  playerGames: (league: LeagueRef, id: PlayerId, range: TimeRange) =>
    [
      ...leagueRoot(league),
      "players",
      id,
      "games",
      ...timeRangeKey(range),
    ] as const,
  playerRemovalPreview: (league: LeagueRef, id: PlayerId) =>
    [...leagueRoot(league), "players", id, "removal-preview"] as const,
  pool: (league: LeagueRef) => [...leagueRoot(league), "pool"] as const,
  pausePreview: (league: LeagueRef, courts: number) =>
    [...leagueRoot(league), "pool", "pause-preview", courts] as const,
  activeRound: (league: LeagueRef) =>
    [...leagueRoot(league), "rounds", "active"] as const,
  round: (league: LeagueRef, id: string) =>
    [...leagueRoot(league), "rounds", id] as const,
  historyRoot: (league: LeagueRef) =>
    [...leagueRoot(league), "rounds", "history"] as const,
  history: (league: LeagueRef, range: TimeRange) =>
    [...queryKeys.historyRoot(league), ...timeRangeKey(range)] as const,
  settings: (league: LeagueRef) => [...leagueRoot(league), "settings"] as const,
  publicViewRoot: (organizationSlug: string) =>
    ["public-view", organizationSlug] as const,
  publicViewEntry: (organizationSlug: string) =>
    [...queryKeys.publicViewRoot(organizationSlug), "entry"] as const,
  publicViewContext: (view: PublicViewRef) =>
    [
      ...queryKeys.publicViewRoot(view.organizationSlug),
      "leagues",
      view.leagueId,
      "context",
    ] as const,
  publicViewDashboard: (view: PublicViewRef) =>
    [
      ...queryKeys.publicViewRoot(view.organizationSlug),
      "leagues",
      view.leagueId,
      "dashboard",
    ] as const,
  publicViewActiveRound: (view: PublicViewRef) =>
    [
      ...queryKeys.publicViewRoot(view.organizationSlug),
      "leagues",
      view.leagueId,
      "round",
    ] as const,
  publicViewHistory: (view: PublicViewRef, range: TimeRange) =>
    [
      ...queryKeys.publicViewRoot(view.organizationSlug),
      "leagues",
      view.leagueId,
      "history",
      ...timeRangeKey(range),
    ] as const,
}

export const PLAYER_NOT_FOUND_MESSAGE = "player.not_found"

export const accountQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.account,
    queryFn: () => fetchAccount(),
  })

export const summaryQueryOptions = (league: LeagueRef) =>
  queryOptions({
    queryKey: queryKeys.summary(league),
    queryFn: () => fetchSummary({ data: league }),
  })

export const playersQueryOptions = (league: LeagueRef) =>
  queryOptions({
    queryKey: queryKeys.players(league),
    queryFn: () => fetchPlayers({ data: league }),
  })

export const playerQueryOptions = (league: LeagueRef, playerId: PlayerId) =>
  queryOptions({
    queryKey: queryKeys.player(league, playerId),
    queryFn: () => fetchPlayer({ data: { ...league, playerId } }),
  })

export const playerRatingHistoryQueryOptions = (
  league: LeagueRef,
  playerId: PlayerId,
  range: TimeRange
) =>
  queryOptions({
    queryKey: queryKeys.playerRatingHistory(league, playerId, range),
    queryFn: () =>
      fetchPlayerRatingHistory({ data: { ...league, playerId, range } }),
  })

export const playerGamesQueryOptions = (
  league: LeagueRef,
  playerId: PlayerId,
  range: TimeRange
) =>
  queryOptions({
    queryKey: queryKeys.playerGames(league, playerId, range),
    queryFn: () => fetchPlayerGames({ data: { ...league, playerId, range } }),
  })

export const playerRemovalPreviewQueryOptions = (
  league: LeagueRef,
  playerId: PlayerId
) =>
  queryOptions({
    queryKey: queryKeys.playerRemovalPreview(league, playerId),
    queryFn: () => fetchPlayerRemovalPreview({ data: { ...league, playerId } }),
  })

export const poolQueryOptions = (league: LeagueRef) =>
  queryOptions({
    queryKey: queryKeys.pool(league),
    queryFn: () => fetchPool({ data: league }),
  })

export const pausePreviewQueryOptions = (league: LeagueRef, courts: number) =>
  queryOptions({
    queryKey: queryKeys.pausePreview(league, courts),
    queryFn: () => fetchPausePreview({ data: { ...league, courts } }),
  })

export const activeRoundQueryOptions = (league: LeagueRef) =>
  queryOptions({
    queryKey: queryKeys.activeRound(league),
    queryFn: () => fetchActiveRound({ data: league }),
  })

export const historyQueryOptions = (league: LeagueRef, range: TimeRange) =>
  queryOptions({
    queryKey: queryKeys.history(league, range),
    queryFn: () => fetchHistory({ data: { ...league, range } }),
  })

export const settingsQueryOptions = (league: LeagueRef) =>
  queryOptions({
    queryKey: queryKeys.settings(league),
    queryFn: () => fetchSettings({ data: league }),
  })

export const leaguesQueryOptions = (organizationId: string) =>
  queryOptions({
    queryKey: queryKeys.leagues(organizationId),
    queryFn: () => fetchLeagues({ data: { organizationId } }),
  })

export const leagueContextQueryOptions = (
  organizationId: string,
  organizationSlug: string,
  leagueId: string
) =>
  queryOptions({
    queryKey: queryKeys.leagueContext(
      organizationId,
      organizationSlug,
      leagueId
    ),
    queryFn: (): Promise<LeagueContext> =>
      fetchLeagueContext({
        data: { organizationId, organizationSlug, leagueId },
      }),
  })

export const organizationsQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.organizations,
    queryFn: () => fetchOrganizations(),
  })

export const organizationQueryOptions = (organizationId: string) =>
  queryOptions({
    queryKey: queryKeys.organization(organizationId),
    queryFn: () => fetchOrganization({ data: { organizationId } }),
  })

export const organizationAuditQueryOptions = (
  organizationId: string,
  page: number
) =>
  queryOptions({
    queryKey: queryKeys.organizationAudit(organizationId, page),
    queryFn: () =>
      fetchOrganizationAuditPage({ data: { organizationId, page } }),
  })

export const organizationInvitationQueryOptions = (invitationId: string) =>
  queryOptions({
    queryKey: queryKeys.organizationInvitation(invitationId),
    queryFn: () => fetchOrganizationInvitation({ data: { invitationId } }),
  })

export const organizationJoinLinkQueryOptions = (token: string) =>
  queryOptions({
    queryKey: queryKeys.organizationJoinLink(token),
    queryFn: () => inspectOrganizationJoinLink({ data: { token } }),
  })

export const publicViewEntryQueryOptions = (organizationSlug: string) =>
  queryOptions({
    queryKey: queryKeys.publicViewEntry(organizationSlug),
    queryFn: () => fetchPublicViewEntry({ data: { organizationSlug } }),
  })

export const publicViewContextQueryOptions = (view: PublicViewRef) =>
  queryOptions({
    queryKey: queryKeys.publicViewContext(view),
    queryFn: () => fetchPublicViewContext({ data: view }),
  })

export const publicViewDashboardQueryOptions = (view: PublicViewRef) =>
  queryOptions({
    queryKey: queryKeys.publicViewDashboard(view),
    queryFn: () => fetchPublicViewDashboard({ data: view }),
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  })

export const publicViewActiveRoundQueryOptions = (view: PublicViewRef) =>
  queryOptions({
    queryKey: queryKeys.publicViewActiveRound(view),
    queryFn: () => fetchPublicViewActiveRound({ data: view }),
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
  })

export const publicViewHistoryQueryOptions = (
  view: PublicViewRef,
  range: TimeRange
) =>
  queryOptions({
    queryKey: queryKeys.publicViewHistory(view, range),
    queryFn: () => fetchPublicViewHistory({ data: { ...view, range } }),
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  })

import type { CreatePlayerResult } from "../player-name"
import type { PlayerRemoval } from "../player-removal"
import type { LeagueRef } from "./queries"
import {
  normalizeOrganizationLogo,
  organizationLogoFilePayload,
} from "../organization-logo-client"
import { DomainError } from "../domain-errors"
import type {
  GameId,
  OrganizationRole,
  Player,
  PlayerId,
  Pool,
  Round,
  Settings,
} from "../types"
import type { OrganizationBrandColor } from "../organization-brand"
import {
  createPlayer as createPlayerOnServer,
  deletePlayer as deletePlayerOnServer,
} from "@/server/functions/players"
import { savePool as savePoolOnServer } from "@/server/functions/pool"
import {
  annulRound as annulRoundOnServer,
  cancelOpenGames,
  commitRound as commitRoundOnServer,
  enterResult as enterResultOnServer,
  generateRound as generateRoundOnServer,
  setGameCancelled as setGameCancelledOnServer,
} from "@/server/functions/rounds"
import { saveSettings as saveSettingsOnServer } from "@/server/functions/settings"
import {
  acceptOrganizationInvitation as acceptOrganizationInvitationOnServer,
  createOrganization as createOrganizationOnServer,
  inviteOrganizationMember as inviteOrganizationMemberOnServer,
  removeOrganizationMember as removeOrganizationMemberOnServer,
  resendOrganizationInvitation as resendOrganizationInvitationOnServer,
  retryOrganizationProvisioning as retryOrganizationProvisioningOnServer,
  revokeOrganizationInvitation as revokeOrganizationInvitationOnServer,
  setActiveOrganization as setActiveOrganizationOnServer,
  updateOrganization as updateOrganizationOnServer,
  updateOrganizationBrandColor as updateOrganizationBrandColorOnServer,
  updateOrganizationMemberRole as updateOrganizationMemberRoleOnServer,
  updateOrganizationPublicView as updateOrganizationPublicViewOnServer,
} from "@/server/functions/organizations"
import {
  authenticatePublicView as authenticatePublicViewOnServer,
  endPublicViewSession as endPublicViewSessionOnServer,
} from "@/server/functions/public-view"
import {
  acceptOrganizationJoinLink as acceptOrganizationJoinLinkOnServer,
  createOrganizationJoinLink as createOrganizationJoinLinkOnServer,
  revokeOrganizationJoinLink as revokeOrganizationJoinLinkOnServer,
} from "@/server/functions/organization-join-links"
import {
  confirmOrganizationLogoUpload as confirmOrganizationLogoUploadOnServer,
  prepareOrganizationLogoUpload as prepareOrganizationLogoUploadOnServer,
  removeOrganizationLogo as removeOrganizationLogoOnServer,
} from "@/server/functions/organization-logos"
import { createLeague as createLeagueOnServer } from "@/server/functions/leagues"

export interface CreatePlayerInput {
  firstName: string
  lastName: string
  rating: number
  rd: number
}

export function createPlayer(
  league: LeagueRef,
  input: CreatePlayerInput
): Promise<CreatePlayerResult> {
  return createPlayerOnServer({
    data: { ...league, ...input },
  })
}

export interface DeletePlayerResult {
  id: PlayerId
  kind: PlayerRemoval
}

export function deletePlayer(
  league: LeagueRef,
  player: Player
): Promise<DeletePlayerResult> {
  return deletePlayerOnServer({
    data: {
      ...league,
      playerId: player.id,
    },
  })
}

export function savePool(league: LeagueRef, pool: Pool): Promise<Pool> {
  return savePoolOnServer({
    data: { ...league, pool },
  })
}

export function saveSettings(
  league: LeagueRef,
  settings: Settings
): Promise<Settings> {
  return saveSettingsOnServer({
    data: { ...league, settings },
  })
}

export interface GenerateRoundInput {
  courts: number
}

export function generateRound(
  league: LeagueRef,
  input: GenerateRoundInput
): Promise<Round> {
  return generateRoundOnServer({
    data: { ...league, courts: input.courts },
  })
}

export interface EnterResultInput {
  round: Round
  gameId: GameId
  pointsA: number
  pointsB: number
}

export function enterResult(
  league: LeagueRef,
  input: EnterResultInput
): Promise<Round> {
  return enterResultOnServer({
    data: {
      ...league,
      roundId: input.round.id,
      gameId: input.gameId,
      pointsA: input.pointsA,
      pointsB: input.pointsB,
    },
  })
}

export interface SetGameCancelledInput {
  round: Round
  gameId: GameId
  cancelled: boolean
}

export function setGameCancelled(
  league: LeagueRef,
  input: SetGameCancelledInput
): Promise<Round> {
  return setGameCancelledOnServer({
    data: {
      ...league,
      roundId: input.round.id,
      gameId: input.gameId,
      cancelled: input.cancelled,
    },
  })
}

export function cancelOpenRoundGames(
  league: LeagueRef,
  round: Round
): Promise<Round> {
  return cancelOpenGames({
    data: { ...league, roundId: round.id },
  })
}

export function annulRound(league: LeagueRef, round: Round): Promise<Round> {
  return annulRoundOnServer({
    data: { ...league, roundId: round.id },
  })
}

export function commitRound(league: LeagueRef, round: Round): Promise<Round> {
  return commitRoundOnServer({
    data: { ...league, roundId: round.id },
  })
}

export function createLeague(organizationId: string, name: string) {
  return createLeagueOnServer({ data: { organizationId, name } })
}

export interface OrganizationInput {
  name: string
  slug: string
}

export interface CreateOrganizationInput extends OrganizationInput {
  brandColor: OrganizationBrandColor
}

export function createOrganization(input: CreateOrganizationInput) {
  return createOrganizationOnServer({ data: input })
}

export function updateOrganizationBrandColor(
  organizationId: string,
  brandColor: OrganizationBrandColor
) {
  return updateOrganizationBrandColorOnServer({
    data: { organizationId, brandColor },
  })
}

export function retryOrganizationProvisioning(organizationId: string) {
  return retryOrganizationProvisioningOnServer({ data: { organizationId } })
}

export function setActiveOrganization(organizationId: string) {
  return setActiveOrganizationOnServer({ data: { organizationId } })
}

export function updateOrganization(
  organizationId: string,
  input: OrganizationInput
) {
  return updateOrganizationOnServer({
    data: { organizationId, ...input },
  })
}

export function inviteOrganizationMember(input: {
  organizationId: string
  email: string
  role: OrganizationRole
}) {
  return inviteOrganizationMemberOnServer({ data: input })
}

export function resendOrganizationInvitation(
  organizationId: string,
  invitationId: string
) {
  return resendOrganizationInvitationOnServer({
    data: { organizationId, invitationId },
  })
}

export function revokeOrganizationInvitation(
  organizationId: string,
  invitationId: string
) {
  return revokeOrganizationInvitationOnServer({
    data: { organizationId, invitationId },
  })
}

export function updateOrganizationMemberRole(input: {
  organizationId: string
  memberId: string
  role: OrganizationRole
}) {
  return updateOrganizationMemberRoleOnServer({ data: input })
}

export function removeOrganizationMember(
  organizationId: string,
  memberId: string
) {
  return removeOrganizationMemberOnServer({
    data: { organizationId, memberId },
  })
}

export function acceptOrganizationInvitation(invitationId: string) {
  return acceptOrganizationInvitationOnServer({ data: { invitationId } })
}

export function createOrganizationJoinLink(input: {
  organizationId: string
  expiresInDays: number
  maxUses: number
}) {
  return createOrganizationJoinLinkOnServer({ data: input })
}

export function revokeOrganizationJoinLink(
  organizationId: string,
  joinLinkId: string
) {
  return revokeOrganizationJoinLinkOnServer({
    data: { organizationId, joinLinkId },
  })
}

export function acceptOrganizationJoinLink(token: string) {
  return acceptOrganizationJoinLinkOnServer({ data: { token } })
}

export async function uploadOrganizationLogo(
  organizationId: string,
  file: File
) {
  const payload = await organizationLogoFilePayload(file)
  const upload = await prepareOrganizationLogoUploadOnServer({
    data: { organizationId, ...payload },
  })
  if (Date.parse(upload.expiresAt) <= Date.now()) {
    throw new DomainError("organization.logo_upload_expired")
  }

  const url = import.meta.env.VITE_SUPABASE_URL
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  if (!url || !publishableKey) {
    throw new DomainError("organization.logo_storage_failed")
  }
  const normalized = await normalizeOrganizationLogo(file)
  const { createClient } = await import("@supabase/supabase-js")
  const client = createClient(url, publishableKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  })
  const { error } = await client.storage
    .from(upload.bucket)
    .uploadToSignedUrl(upload.path, upload.token, normalized, {
      cacheControl: "0",
      contentType: "image/webp",
    })
  if (error) throw new DomainError("organization.logo_storage_failed")
  if (Date.parse(upload.expiresAt) <= Date.now()) {
    throw new DomainError("organization.logo_upload_expired")
  }
  return confirmOrganizationLogoUploadOnServer({
    data: { organizationId, grant: upload.grant },
  })
}

export function removeOrganizationLogo(organizationId: string) {
  return removeOrganizationLogoOnServer({ data: { organizationId } })
}

export function updateOrganizationPublicView(
  organizationId: string,
  input: { action: "enable"; password: string } | { action: "disable" }
) {
  return updateOrganizationPublicViewOnServer({
    data: { organizationId, ...input },
  })
}

export function authenticatePublicView(
  organizationSlug: string,
  password: string
) {
  return authenticatePublicViewOnServer({
    data: { organizationSlug, password },
  })
}

export function endPublicViewSession(organizationSlug: string) {
  return endPublicViewSessionOnServer({ data: { organizationSlug } })
}

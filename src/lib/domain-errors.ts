/**
 * Stable, language-neutral identifiers for expected validation and domain failures.
 *
 * Codes cross the server-function boundary as `Error.message`, because custom Error
 * properties are not guaranteed to survive serialization. Presentation code translates
 * them at the UI boundary.
 */
export const DOMAIN_ISSUE_CODES = [
  "score.required",
  "score.integer",
  "score.non_negative",
  "score.draw_not_allowed",
  "score.minimum_not_reached",
  "score.extended_margin",
  "player.first_name_required",
  "player.last_name_required",
  "player.rating_out_of_range",
  "player.rd_out_of_range",
  "player.not_found",
  "pool.duplicate_player",
  "pool.duplicate_fixed_team",
  "pool.fixed_team_distinct_players",
  "pool.player_in_multiple_fixed_teams",
  "pool.fixed_team_player_missing",
  "pool.unknown_player",
  "settings.initial_rating_out_of_range",
  "settings.initial_rd_out_of_range",
  "settings.sort_column_hidden",
  "settings.not_found",
  "time_range.both_required",
  "time_range.from_required",
  "time_range.to_required",
  "time_range.from_invalid",
  "time_range.to_invalid",
  "time_range.invalid_order",
  "round.active_exists",
  "round.too_few_players",
  "round.too_many_fixed_teams",
  "round.creation_failed",
  "round.game_not_active",
  "round.all_games_required",
  "round.not_found",
  "round.already_committed",
  "round.open_games",
  "round.no_active_round",
  "matcher.player_count",
  "matcher.no_valid_assignment",
  "matcher.optimality_timeout",
  "matcher.no_solution",
  "matcher.attempts",
  "matcher.teams",
  "matcher.fixed_teams",
  "matcher.unknown_player",
  "matcher.explanation_empty",
  "pause.count_unfulfillable",
  "glicko.invalid_score",
  "organization.not_found",
  "organization.forbidden",
  "organization.slug_taken",
  "organization.limit_reached",
  "organization.invitation_limit_reached",
  "organization.member_exists",
  "organization.last_owner",
  "organization.invitation_invalid",
  "organization.invitation_recipient_mismatch",
  "organization.join_link_invalid",
  "organization.join_link_expired",
  "organization.join_link_exhausted",
  "organization.join_link_revoked",
  "organization.join_link_rate_limited",
  "organization.action_failed",
  "organization.logo_invalid_type",
  "organization.logo_too_large",
  "organization.logo_dimensions",
  "organization.logo_invalid_image",
  "organization.logo_not_normalized",
  "organization.logo_upload_expired",
  "organization.logo_storage_failed",
  "public_view.unavailable",
  "public_view.invalid_password",
  "public_view.rate_limited",
  "public_view.unauthorized",
  "league.not_found",
  "league.forbidden",
  "league.name_taken",
] as const

export type DomainIssueCode = (typeof DOMAIN_ISSUE_CODES)[number]

export interface DomainIssue {
  code: DomainIssueCode
  values?: Readonly<Record<string, number | string>>
}

const DOMAIN_ISSUE_CODE_SET = new Set<string>(DOMAIN_ISSUE_CODES)

export function domainIssue(
  code: DomainIssueCode,
  values?: DomainIssue["values"]
): DomainIssue {
  return values ? { code, values } : { code }
}

export class DomainError extends Error {
  readonly code: DomainIssueCode

  constructor(code: DomainIssueCode) {
    super(code)
    this.name = "DomainError"
    this.code = code
  }
}

export function isDomainIssueCode(value: unknown): value is DomainIssueCode {
  return typeof value === "string" && DOMAIN_ISSUE_CODE_SET.has(value)
}

export function domainIssueFromError(error: unknown): DomainIssue | null {
  if (!(error instanceof Error) || !isDomainIssueCode(error.message))
    return null
  return domainIssue(error.message)
}

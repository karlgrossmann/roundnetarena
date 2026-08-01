import { documentTitle } from "@/lib/brand"
import { getLocale } from "@/paraglide/runtime.js"
import type { Locale } from "@/paraglide/runtime.js"
import { domain_matcher_attempts } from "@/paraglide/messages/domain_matcher_attempts.js"
import { domain_matcher_explanation_empty } from "@/paraglide/messages/domain_matcher_explanation_empty.js"
import { domain_matcher_fixed_teams } from "@/paraglide/messages/domain_matcher_fixed_teams.js"
import { domain_matcher_no_solution } from "@/paraglide/messages/domain_matcher_no_solution.js"
import { domain_matcher_no_valid_assignment } from "@/paraglide/messages/domain_matcher_no_valid_assignment.js"
import { domain_matcher_optimality_timeout } from "@/paraglide/messages/domain_matcher_optimality_timeout.js"
import { domain_matcher_player_count } from "@/paraglide/messages/domain_matcher_player_count.js"
import { domain_matcher_teams } from "@/paraglide/messages/domain_matcher_teams.js"
import { domain_matcher_unknown_player } from "@/paraglide/messages/domain_matcher_unknown_player.js"
import { domain_pause_count_unfulfillable } from "@/paraglide/messages/domain_pause_count_unfulfillable.js"
import { domain_glicko_invalid_score } from "@/paraglide/messages/domain_glicko_invalid_score.js"
import { domain_organization_action_failed } from "@/paraglide/messages/domain_organization_action_failed.js"
import { domain_organization_logo_dimensions } from "@/paraglide/messages/domain_organization_logo_dimensions.js"
import { domain_organization_logo_invalid_image } from "@/paraglide/messages/domain_organization_logo_invalid_image.js"
import { domain_organization_logo_invalid_type } from "@/paraglide/messages/domain_organization_logo_invalid_type.js"
import { domain_organization_logo_not_normalized } from "@/paraglide/messages/domain_organization_logo_not_normalized.js"
import { domain_organization_logo_storage_failed } from "@/paraglide/messages/domain_organization_logo_storage_failed.js"
import { domain_organization_logo_too_large } from "@/paraglide/messages/domain_organization_logo_too_large.js"
import { domain_organization_logo_upload_expired } from "@/paraglide/messages/domain_organization_logo_upload_expired.js"
import { domain_league_forbidden } from "@/paraglide/messages/domain_league_forbidden.js"
import { domain_league_name_taken } from "@/paraglide/messages/domain_league_name_taken.js"
import { domain_league_not_found } from "@/paraglide/messages/domain_league_not_found.js"
import { domain_organization_forbidden } from "@/paraglide/messages/domain_organization_forbidden.js"
import { domain_organization_invitation_invalid } from "@/paraglide/messages/domain_organization_invitation_invalid.js"
import { domain_organization_invitation_limit_reached } from "@/paraglide/messages/domain_organization_invitation_limit_reached.js"
import { domain_organization_invitation_recipient_mismatch } from "@/paraglide/messages/domain_organization_invitation_recipient_mismatch.js"
import { domain_organization_join_link_exhausted } from "@/paraglide/messages/domain_organization_join_link_exhausted.js"
import { domain_organization_join_link_expired } from "@/paraglide/messages/domain_organization_join_link_expired.js"
import { domain_organization_join_link_invalid } from "@/paraglide/messages/domain_organization_join_link_invalid.js"
import { domain_organization_join_link_rate_limited } from "@/paraglide/messages/domain_organization_join_link_rate_limited.js"
import { domain_organization_join_link_revoked } from "@/paraglide/messages/domain_organization_join_link_revoked.js"
import { domain_organization_last_owner } from "@/paraglide/messages/domain_organization_last_owner.js"
import { domain_organization_limit_reached } from "@/paraglide/messages/domain_organization_limit_reached.js"
import { domain_organization_member_exists } from "@/paraglide/messages/domain_organization_member_exists.js"
import { domain_organization_not_found } from "@/paraglide/messages/domain_organization_not_found.js"
import { domain_organization_slug_taken } from "@/paraglide/messages/domain_organization_slug_taken.js"
import { domain_public_view_invalid_password } from "@/paraglide/messages/domain_public_view_invalid_password.js"
import { domain_public_view_rate_limited } from "@/paraglide/messages/domain_public_view_rate_limited.js"
import { domain_public_view_unauthorized } from "@/paraglide/messages/domain_public_view_unauthorized.js"
import { domain_public_view_unavailable } from "@/paraglide/messages/domain_public_view_unavailable.js"
import { domain_player_not_found } from "@/paraglide/messages/domain_player_not_found.js"
import { domain_pool_duplicate_fixed_team } from "@/paraglide/messages/domain_pool_duplicate_fixed_team.js"
import { domain_pool_duplicate_player } from "@/paraglide/messages/domain_pool_duplicate_player.js"
import { domain_pool_fixed_team_distinct_players } from "@/paraglide/messages/domain_pool_fixed_team_distinct_players.js"
import { domain_pool_fixed_team_player_missing } from "@/paraglide/messages/domain_pool_fixed_team_player_missing.js"
import { domain_pool_player_in_multiple_fixed_teams } from "@/paraglide/messages/domain_pool_player_in_multiple_fixed_teams.js"
import { domain_pool_unknown_player } from "@/paraglide/messages/domain_pool_unknown_player.js"
import { domain_round_active_exists } from "@/paraglide/messages/domain_round_active_exists.js"
import { domain_round_all_games_required } from "@/paraglide/messages/domain_round_all_games_required.js"
import { domain_round_already_committed } from "@/paraglide/messages/domain_round_already_committed.js"
import { domain_round_creation_failed } from "@/paraglide/messages/domain_round_creation_failed.js"
import { domain_round_game_not_active } from "@/paraglide/messages/domain_round_game_not_active.js"
import { domain_round_no_active_round } from "@/paraglide/messages/domain_round_no_active_round.js"
import { domain_round_not_found } from "@/paraglide/messages/domain_round_not_found.js"
import { domain_round_open_games } from "@/paraglide/messages/domain_round_open_games.js"
import { domain_round_too_few_players } from "@/paraglide/messages/domain_round_too_few_players.js"
import { domain_round_too_many_fixed_teams } from "@/paraglide/messages/domain_round_too_many_fixed_teams.js"
import { domain_settings_not_found } from "@/paraglide/messages/domain_settings_not_found.js"
import { domain_settings_sort_column_hidden } from "@/paraglide/messages/domain_settings_sort_column_hidden.js"
import { route_title_dashboard } from "@/paraglide/messages/route_title_dashboard.js"
import { route_title_forgot_password } from "@/paraglide/messages/route_title_forgot_password.js"
import { route_title_history } from "@/paraglide/messages/route_title_history.js"
import { route_title_player } from "@/paraglide/messages/route_title_player.js"
import { route_title_register } from "@/paraglide/messages/route_title_register.js"
import { route_title_resend_verification } from "@/paraglide/messages/route_title_resend_verification.js"
import { route_title_reset_password } from "@/paraglide/messages/route_title_reset_password.js"
import { route_title_round } from "@/paraglide/messages/route_title_round.js"
import { route_title_settings } from "@/paraglide/messages/route_title_settings.js"
import { route_title_sign_in } from "@/paraglide/messages/route_title_sign_in.js"
import { route_title_verify_email } from "@/paraglide/messages/route_title_verify_email.js"
import { route_title_accept_invitation } from "@/paraglide/messages/route_title_accept_invitation.js"
import { route_title_join_organization } from "@/paraglide/messages/route_title_join_organization.js"
import { route_title_create_organization } from "@/paraglide/messages/route_title_create_organization.js"
import { route_title_organization } from "@/paraglide/messages/route_title_organization.js"
import { route_title_create_league } from "@/paraglide/messages/route_title_create_league.js"
import { route_title_organizations } from "@/paraglide/messages/route_title_organizations.js"
import { app_meta_description } from "@/paraglide/messages/app_meta_description.js"
import { validation_player_first_name_required } from "@/paraglide/messages/validation_player_first_name_required.js"
import { validation_player_last_name_required } from "@/paraglide/messages/validation_player_last_name_required.js"
import { validation_player_rating } from "@/paraglide/messages/validation_player_rating.js"
import { validation_player_rd } from "@/paraglide/messages/validation_player_rd.js"
import { validation_score_draw_not_allowed } from "@/paraglide/messages/validation_score_draw_not_allowed.js"
import { validation_score_extended_margin } from "@/paraglide/messages/validation_score_extended_margin.js"
import { validation_score_integer } from "@/paraglide/messages/validation_score_integer.js"
import { validation_score_low } from "@/paraglide/messages/validation_score_low.js"
import { validation_score_non_negative } from "@/paraglide/messages/validation_score_non_negative.js"
import { validation_score_required } from "@/paraglide/messages/validation_score_required.js"
import { validation_settings_initial_rating } from "@/paraglide/messages/validation_settings_initial_rating.js"
import { validation_settings_initial_rd } from "@/paraglide/messages/validation_settings_initial_rd.js"
import { validation_time_range_both_required } from "@/paraglide/messages/validation_time_range_both_required.js"
import { validation_time_range_from_invalid } from "@/paraglide/messages/validation_time_range_from_invalid.js"
import { validation_time_range_from_required } from "@/paraglide/messages/validation_time_range_from_required.js"
import { validation_time_range_invalid_order } from "@/paraglide/messages/validation_time_range_invalid_order.js"
import { validation_time_range_to_invalid } from "@/paraglide/messages/validation_time_range_to_invalid.js"
import { validation_time_range_to_required } from "@/paraglide/messages/validation_time_range_to_required.js"
import type { DomainIssue } from "./domain-errors"

export type PageTitleKey =
  | "signIn"
  | "register"
  | "verifyEmail"
  | "resendVerification"
  | "forgotPassword"
  | "resetPassword"
  | "acceptInvitation"
  | "joinOrganization"
  | "organizations"
  | "createOrganization"
  | "organization"
  | "createLeague"
  | "dashboard"
  | "round"
  | "history"
  | "settings"
  | "player"

export function pageTitle(
  key: PageTitleKey,
  locale: Locale = getLocale()
): string {
  const options = { locale }
  switch (key) {
    case "signIn":
      return route_title_sign_in({}, options)
    case "register":
      return route_title_register({}, options)
    case "verifyEmail":
      return route_title_verify_email({}, options)
    case "resendVerification":
      return route_title_resend_verification({}, options)
    case "forgotPassword":
      return route_title_forgot_password({}, options)
    case "resetPassword":
      return route_title_reset_password({}, options)
    case "acceptInvitation":
      return route_title_accept_invitation({}, options)
    case "joinOrganization":
      return route_title_join_organization({}, options)
    case "organizations":
      return route_title_organizations({}, options)
    case "createOrganization":
      return route_title_create_organization({}, options)
    case "organization":
      return route_title_organization({}, options)
    case "createLeague":
      return route_title_create_league({}, options)
    case "dashboard":
      return route_title_dashboard({}, options)
    case "round":
      return route_title_round({}, options)
    case "history":
      return route_title_history({}, options)
    case "settings":
      return route_title_settings({}, options)
    case "player":
      return route_title_player({}, options)
  }
}

export function localizedRouteHead(key: PageTitleKey) {
  return {
    meta: [
      { title: documentTitle(pageTitle(key)) },
      { name: "description", content: app_meta_description() },
    ],
  }
}

export function translateDomainIssue(
  issue: DomainIssue,
  locale: Locale = getLocale()
): string {
  const options = { locale }

  switch (issue.code) {
    case "score.required":
      return validation_score_required({}, options)
    case "score.integer":
      return validation_score_integer({}, options)
    case "score.non_negative":
      return validation_score_non_negative({}, options)
    case "score.draw_not_allowed":
      return validation_score_draw_not_allowed({}, options)
    case "score.minimum_not_reached":
      return validation_score_low(
        { minimum: issue.values?.minimum ?? 15 },
        options
      )
    case "score.extended_margin":
      return validation_score_extended_margin({}, options)
    case "player.first_name_required":
      return validation_player_first_name_required({}, options)
    case "player.last_name_required":
      return validation_player_last_name_required({}, options)
    case "player.rating_out_of_range":
      return validation_player_rating({}, options)
    case "player.rd_out_of_range":
      return validation_player_rd({}, options)
    case "settings.initial_rating_out_of_range":
      return validation_settings_initial_rating({}, options)
    case "settings.initial_rd_out_of_range":
      return validation_settings_initial_rd({}, options)
    case "time_range.both_required":
      return validation_time_range_both_required({}, options)
    case "time_range.from_required":
      return validation_time_range_from_required({}, options)
    case "time_range.to_required":
      return validation_time_range_to_required({}, options)
    case "time_range.from_invalid":
      return validation_time_range_from_invalid({}, options)
    case "time_range.to_invalid":
      return validation_time_range_to_invalid({}, options)
    case "time_range.invalid_order":
      return validation_time_range_invalid_order({}, options)
    case "pool.duplicate_player":
      return domain_pool_duplicate_player({}, options)
    case "pool.duplicate_fixed_team":
      return domain_pool_duplicate_fixed_team({}, options)
    case "pool.fixed_team_distinct_players":
      return domain_pool_fixed_team_distinct_players({}, options)
    case "pool.player_in_multiple_fixed_teams":
      return domain_pool_player_in_multiple_fixed_teams({}, options)
    case "pool.fixed_team_player_missing":
      return domain_pool_fixed_team_player_missing({}, options)
    case "pool.unknown_player":
      return domain_pool_unknown_player({}, options)
    case "settings.sort_column_hidden":
      return domain_settings_sort_column_hidden({}, options)
    case "settings.not_found":
      return domain_settings_not_found({}, options)
    case "player.not_found":
      return domain_player_not_found({}, options)
    case "round.active_exists":
      return domain_round_active_exists({}, options)
    case "round.too_few_players":
      return domain_round_too_few_players({}, options)
    case "round.too_many_fixed_teams":
      return domain_round_too_many_fixed_teams({}, options)
    case "round.creation_failed":
      return domain_round_creation_failed({}, options)
    case "round.game_not_active":
      return domain_round_game_not_active({}, options)
    case "round.all_games_required":
      return domain_round_all_games_required({}, options)
    case "round.not_found":
      return domain_round_not_found({}, options)
    case "round.already_committed":
      return domain_round_already_committed({}, options)
    case "round.open_games":
      return domain_round_open_games(
        { count: issue.values?.count ?? 0 },
        options
      )
    case "round.no_active_round":
      return domain_round_no_active_round({}, options)
    case "matcher.player_count":
      return domain_matcher_player_count({}, options)
    case "matcher.no_valid_assignment":
      return domain_matcher_no_valid_assignment({}, options)
    case "matcher.optimality_timeout":
      return domain_matcher_optimality_timeout({}, options)
    case "matcher.no_solution":
      return domain_matcher_no_solution({}, options)
    case "matcher.attempts":
      return domain_matcher_attempts({}, options)
    case "matcher.teams":
      return domain_matcher_teams({}, options)
    case "matcher.fixed_teams":
      return domain_matcher_fixed_teams({}, options)
    case "matcher.unknown_player":
      return domain_matcher_unknown_player({}, options)
    case "matcher.explanation_empty":
      return domain_matcher_explanation_empty({}, options)
    case "pause.count_unfulfillable":
      return domain_pause_count_unfulfillable({}, options)
    case "glicko.invalid_score":
      return domain_glicko_invalid_score({}, options)
    case "organization.not_found":
      return domain_organization_not_found({}, options)
    case "organization.forbidden":
      return domain_organization_forbidden({}, options)
    case "organization.slug_taken":
      return domain_organization_slug_taken({}, options)
    case "organization.limit_reached":
      return domain_organization_limit_reached({}, options)
    case "organization.invitation_limit_reached":
      return domain_organization_invitation_limit_reached({}, options)
    case "organization.member_exists":
      return domain_organization_member_exists({}, options)
    case "organization.last_owner":
      return domain_organization_last_owner({}, options)
    case "organization.invitation_invalid":
      return domain_organization_invitation_invalid({}, options)
    case "organization.invitation_recipient_mismatch":
      return domain_organization_invitation_recipient_mismatch({}, options)
    case "organization.join_link_invalid":
      return domain_organization_join_link_invalid({}, options)
    case "organization.join_link_expired":
      return domain_organization_join_link_expired({}, options)
    case "organization.join_link_exhausted":
      return domain_organization_join_link_exhausted({}, options)
    case "organization.join_link_revoked":
      return domain_organization_join_link_revoked({}, options)
    case "organization.join_link_rate_limited":
      return domain_organization_join_link_rate_limited({}, options)
    case "organization.action_failed":
      return domain_organization_action_failed({}, options)
    case "organization.logo_invalid_type":
      return domain_organization_logo_invalid_type({}, options)
    case "organization.logo_too_large":
      return domain_organization_logo_too_large({}, options)
    case "organization.logo_dimensions":
      return domain_organization_logo_dimensions({}, options)
    case "organization.logo_invalid_image":
      return domain_organization_logo_invalid_image({}, options)
    case "organization.logo_not_normalized":
      return domain_organization_logo_not_normalized({}, options)
    case "organization.logo_upload_expired":
      return domain_organization_logo_upload_expired({}, options)
    case "organization.logo_storage_failed":
      return domain_organization_logo_storage_failed({}, options)
    case "public_view.unavailable":
      return domain_public_view_unavailable({}, options)
    case "public_view.invalid_password":
      return domain_public_view_invalid_password({}, options)
    case "public_view.rate_limited":
      return domain_public_view_rate_limited({}, options)
    case "public_view.unauthorized":
      return domain_public_view_unauthorized({}, options)
    case "league.not_found":
      return domain_league_not_found({}, options)
    case "league.forbidden":
      return domain_league_forbidden({}, options)
    case "league.name_taken":
      return domain_league_name_taken({}, options)
  }
}

/**
 * Validation for creating a player. It lives here rather than in the component because
 * this is a system boundary, and because a rule that silently gives way goes unnoticed.
 */

import type { CreatePlayerInput } from "./api/mutations"
import { domainIssue } from "./domain-errors"
import type { DomainIssue } from "./domain-errors"
import {
  INITIAL_RATING_MAX,
  INITIAL_RATING_MIN,
  INITIAL_RD_MAX,
  INITIAL_RD_MIN,
  parseLocalizedNumber,
} from "./rating-defaults"

/** Raw form values — numbers are still text at this point. */
export interface NewPlayerDraft {
  firstName: string
  lastName: string
  rating: string
  rd: string
}

export type NewPlayerErrors = Partial<Record<keyof NewPlayerDraft, DomainIssue>>

export function validateNewPlayer(draft: NewPlayerDraft): NewPlayerErrors {
  const errors: NewPlayerErrors = {}

  if (draft.firstName.trim() === "") {
    errors.firstName = domainIssue("player.first_name_required")
  }

  if (draft.lastName.trim() === "") {
    errors.lastName = domainIssue("player.last_name_required")
  }

  const rating = parseLocalizedNumber(draft.rating)
  if (
    rating === null ||
    !Number.isInteger(rating) ||
    rating < INITIAL_RATING_MIN ||
    rating > INITIAL_RATING_MAX
  ) {
    errors.rating = domainIssue("player.rating_out_of_range")
  }

  const rd = parseLocalizedNumber(draft.rd)
  if (rd === null || rd < INITIAL_RD_MIN || rd > INITIAL_RD_MAX) {
    errors.rd = domainIssue("player.rd_out_of_range")
  }

  return errors
}

export function hasErrors(errors: NewPlayerErrors): boolean {
  return Object.keys(errors).length > 0
}

/**
 * Only call this after validation succeeded — unchecked numbers otherwise end up as
 * `NaN` in the rating.
 */
export function toCreatePlayerInput(draft: NewPlayerDraft): CreatePlayerInput {
  return {
    firstName: draft.firstName.trim(),
    lastName: draft.lastName.trim(),
    rating: Number(draft.rating.trim().replace(",", ".")),
    rd: Number(draft.rd.trim().replace(",", ".")),
  }
}

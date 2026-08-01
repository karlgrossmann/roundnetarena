/** Domain bounds for rating newly created players. */
import { domainIssue } from "./domain-errors"
import type { DomainIssue } from "./domain-errors"

export const INITIAL_RATING_MIN = 100
export const INITIAL_RATING_MAX = 3000
export const INITIAL_RD_MIN = 30
export const INITIAL_RD_MAX = 350

export interface InitialValuesDraft {
  initialRating: string
  initialRd: string
}

export type InitialValuesErrors = Partial<
  Record<keyof InitialValuesDraft, DomainIssue>
>

/** Accepts the German decimal comma, even though the defaults are integers. */
export function parseLocalizedNumber(value: string): number | null {
  const normalized = value.trim().replace(",", ".")
  if (normalized === "") return null

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

export function validateInitialValues(
  draft: InitialValuesDraft
): InitialValuesErrors {
  const errors: InitialValuesErrors = {}
  const initialRating = parseLocalizedNumber(draft.initialRating)
  const initialRd = parseLocalizedNumber(draft.initialRd)

  if (
    initialRating === null ||
    !Number.isInteger(initialRating) ||
    initialRating < INITIAL_RATING_MIN ||
    initialRating > INITIAL_RATING_MAX
  ) {
    errors.initialRating = domainIssue("settings.initial_rating_out_of_range")
  }

  if (
    initialRd === null ||
    !Number.isInteger(initialRd) ||
    initialRd < INITIAL_RD_MIN ||
    initialRd > INITIAL_RD_MAX
  ) {
    errors.initialRd = domainIssue("settings.initial_rd_out_of_range")
  }

  return errors
}

export function hasInitialValueErrors(errors: InitialValuesErrors): boolean {
  return Object.keys(errors).length > 0
}

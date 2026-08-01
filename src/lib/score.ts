/**
 * Validation of entered game results.
 *
 * The rules mirror the prompts of the terminal version
 * (`terminal_interface_gameblock_management.py`). Important: these are **warnings**,
 * not prohibitions. Unusual results happen — the UI asks back but does not block.
 */

import { domainIssue } from "./domain-errors"
import type { DomainIssue } from "./domain-errors"

/** Regular winning score of a set. */
export const TARGET_POINTS = 21

/** Below this score a set looks abandoned. */
const IMPLAUSIBLY_LOW = 15

/** From this score on a set counts as extended; a margin above two points is then not
 *  within the rules. */
const EXTENDED_FROM = TARGET_POINTS

export interface ScoreValidation {
  /** Values are usable at all (non-negative, not a draw). */
  isValid: boolean
  /** Hard errors — saving is impossible. */
  errors: Array<DomainIssue>
  /** Oddities — saving is possible after confirmation. */
  warnings: Array<DomainIssue>
}

export function validateScore(
  pointsA: number,
  pointsB: number
): ScoreValidation {
  const errors: Array<DomainIssue> = []
  const warnings: Array<DomainIssue> = []

  if (!Number.isInteger(pointsA) || !Number.isInteger(pointsB)) {
    errors.push(domainIssue("score.integer"))
  }

  if (pointsA < 0 || pointsB < 0) {
    errors.push(domainIssue("score.non_negative"))
  }

  if (errors.length === 0 && pointsA === pointsB) {
    errors.push(domainIssue("score.draw_not_allowed"))
  }

  if (errors.length > 0) {
    return { isValid: false, errors, warnings }
  }

  const higher = Math.max(pointsA, pointsB)
  const lower = Math.min(pointsA, pointsB)

  if (higher < IMPLAUSIBLY_LOW) {
    warnings.push(
      domainIssue("score.minimum_not_reached", {
        minimum: IMPLAUSIBLY_LOW,
      })
    )
  }

  if (higher > EXTENDED_FROM && higher - lower > 2) {
    warnings.push(domainIssue("score.extended_margin"))
  }

  return { isValid: true, errors, warnings }
}

/**
 * Points from two input fields.
 *
 * `null` until both fields hold an integer — there is nothing to validate before that.
 * A negative value does pass through into `validateScore()`, so the precise message
 * appears there instead of a blanket "please fill this in".
 */
export function parseScoreInput(
  pointsA: string,
  pointsB: string
): { pointsA: number; pointsB: number } | null {
  const a = parsePoints(pointsA)
  const b = parsePoints(pointsB)
  if (a === null || b === null) return null

  return { pointsA: a, pointsB: b }
}

function parsePoints(value: string): number | null {
  const trimmed = value.trim()
  if (!/^-?\d+$/.test(trimmed)) return null

  return Number.parseInt(trimmed, 10)
}

/** Which team won? `null` on an invalid result. */
export function winnerOf(pointsA: number, pointsB: number): "a" | "b" | null {
  if (pointsA === pointsB) return null
  return pointsA > pointsB ? "a" : "b"
}

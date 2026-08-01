/**
 * Derivations and labels for the settings.
 *
 * This is where an option the backend calls `higher_rating_weight` or `lowest_first`
 * gets its visible name: whoever opens the settings is organizing a session, not
 * reading an implementation.
 */

import { ALL_TABLE_COLUMNS, columnLabel } from "./leaderboard"
import {
  settings_algorithm_random,
  settings_algorithm_standard,
  settings_pause_lowest,
} from "@/paraglide/messages.js"
import type {
  MatchingAlgorithm,
  PauseMode,
  Settings,
  TableColumn,
} from "./types"

export interface SettingsOption<TValue extends string> {
  value: TValue
  label: string
}

export function matchingAlgorithmOptions(): ReadonlyArray<
  SettingsOption<MatchingAlgorithm>
> {
  return [
    { value: "default", label: settings_algorithm_standard() },
    { value: "random", label: settings_algorithm_random() },
  ]
}

export function matchingAlgorithmLabel(algorithm: MatchingAlgorithm): string {
  const option = matchingAlgorithmOptions().find(
    (candidate) => candidate.value === algorithm
  )
  return option?.label ?? algorithm
}

export function pauseModeOptions(): ReadonlyArray<SettingsOption<PauseMode>> {
  return [
    { value: "random", label: settings_algorithm_random() },
    { value: "lowest_first", label: settings_pause_lowest() },
  ]
}

export function pauseModeLabel(mode: PauseMode): string {
  const option = pauseModeOptions().find(
    (candidate) => candidate.value === mode
  )
  return option?.label ?? mode
}

/** Bounds of the strong player weight. The backend default is 2.0; below that skill is
 *  hardly balanced anymore, above it little changes. */
export const WEIGHT_MIN = 0.5
export const WEIGHT_MAX = 4
export const WEIGHT_STEP = 0.5

/** The visible columns in table order: "Rating, RD, Games". */
export function visibleColumnsSummary(columns: Array<TableColumn>): string {
  return sortColumns(columns).map(columnLabel).join(", ")
}

/** Choices for "sort by" — visible columns only, because sorting by a hidden column
 *  would be traceable for nobody. */
export function sortByOptions(
  columns: Array<TableColumn>
): Array<SettingsOption<TableColumn>> {
  return sortColumns(columns).map((column) => ({
    value: column,
    label: columnLabel(column),
  }))
}

/**
 * Applies a column selection, straightening out two things: the order follows the
 * table rather than the order of tapping, and the sort column stays a visible one —
 * otherwise the table would sort by something nobody can see.
 */
export function settingsWithColumns(
  settings: Settings,
  columns: Array<TableColumn>
): Settings {
  const ordered = sortColumns(columns)
  const sortBy = ordered.includes(settings.table.sortBy)
    ? settings.table.sortBy
    : (ordered[0] ?? settings.table.sortBy)

  return {
    ...settings,
    table: { ...settings.table, columns: ordered, sortBy },
  }
}

/** Shows or hides a column. Without any column the table would be nothing but names,
 *  so the last one cannot be deselected. */
export function toggleColumn(
  columns: Array<TableColumn>,
  column: TableColumn,
  visible: boolean
): Array<TableColumn> {
  if (!visible) {
    if (columns.length <= 1) return columns
    return columns.filter((candidate) => candidate !== column)
  }

  if (columns.includes(column)) return columns
  return sortColumns([...columns, column])
}

function sortColumns(columns: Array<TableColumn>): Array<TableColumn> {
  return ALL_TABLE_COLUMNS.filter((column) => columns.includes(column))
}

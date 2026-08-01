import "@tanstack/react-start/server-only"

import { eq } from "drizzle-orm"

import type { Settings } from "@/lib/types"

import { getDb } from "../db/client"
import type { Executor } from "../db/client"
import { toSettings } from "../db/mappers"
import { leagueSettings } from "../db/schema"

export async function findSettings(
  executor: Executor = getDb(),
  leagueId: string
): Promise<Settings | null> {
  const rows = await executor
    .select()
    .from(leagueSettings)
    .where(eq(leagueSettings.leagueId, leagueId))
  const row = rows.at(0)
  return row ? toSettings(row) : null
}

export async function upsertSettings(
  executor: Executor,
  leagueId: string,
  settings: Settings
): Promise<Settings> {
  const values = {
    leagueId,
    matchingAlgorithm: settings.matchingAlgorithm,
    higherRatingWeight: settings.higherRatingWeight,
    pauseMode: settings.pauseMode,
    initialRating: settings.initialRating,
    initialRd: settings.initialRd,
    tableColumns: settings.table.columns,
    tableSortBy: settings.table.sortBy,
    tableColoring: settings.table.colorRatingChange,
  }
  await executor.insert(leagueSettings).values(values).onConflictDoUpdate({
    target: leagueSettings.leagueId,
    set: values,
  })
  return settings
}

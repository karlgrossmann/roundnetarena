import { createServerFn } from "@tanstack/react-start"

import { DomainError } from "@/lib/domain-errors"

import { getDb } from "../db/client"
import { authed } from "../middleware/auth"
import { requireLeagueAccess } from "./league-access.server"
import { upsertSettings } from "../repositories/settings"
import { SettingsInputSchema } from "./settings-input"

export const saveSettings = createServerFn({ method: "POST" })
  .middleware([authed])
  .validator(SettingsInputSchema)
  .handler(async ({ context, data }) => {
    if (!data.settings.table.columns.includes(data.settings.table.sortBy)) {
      throw new DomainError("settings.sort_column_hidden")
    }
    return getDb().transaction(async (tx) => {
      await requireLeagueAccess(tx, {
        organizationId: data.organizationId,
        leagueId: data.leagueId,
        userId: context.auth.user.id,
        permission: "play:manage",
      })
      return upsertSettings(tx, data.leagueId, data.settings)
    })
  })

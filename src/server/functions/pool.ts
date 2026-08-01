import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"

import { DomainError } from "@/lib/domain-errors"
import { validatePool } from "@/lib/pool-validation"

import { getDb } from "../db/client"
import { authed } from "../middleware/auth"
import {
  OrganizationLeagueSchema,
  requireLeagueAccess,
} from "./league-access.server"
import { findAllPlayers } from "../repositories/players"
import { replacePool } from "../repositories/pool"

const PlayerRefSchema = z.object({
  id: z.string().min(1),
  displayName: z.string(),
  rating: z.number(),
})
const PoolSchema = OrganizationLeagueSchema.extend({
  pool: z.object({
    updatedAt: z.string().datetime(),
    entries: z.array(
      z.object({
        player: PlayerRefSchema,
        status: z.enum(["playing", "paused", "absent"]),
      })
    ),
    fixedTeams: z.array(
      z.object({
        id: z.string().min(1),
        players: z.tuple([z.string().min(1), z.string().min(1)]),
      })
    ),
  }),
})

export const savePool = createServerFn({ method: "POST" })
  .middleware([authed])
  .validator(PoolSchema)
  .handler(async ({ context, data }) => {
    const pool = {
      ...data.pool,
      updatedAt: new Date().toISOString(),
    }
    const errors = validatePool(pool)
    if (errors.length > 0) throw new DomainError(errors[0].code)

    return getDb().transaction(async (tx) => {
      await requireLeagueAccess(tx, {
        organizationId: data.organizationId,
        leagueId: data.leagueId,
        userId: context.auth.user.id,
        permission: "play:manage",
      })
      const knownPlayerIds = new Set(
        (await findAllPlayers(tx, data.leagueId)).map((player) => player.id)
      )
      if (pool.entries.some((entry) => !knownPlayerIds.has(entry.player.id))) {
        throw new DomainError("pool.unknown_player")
      }
      return replacePool(tx, data.leagueId, pool)
    })
  })

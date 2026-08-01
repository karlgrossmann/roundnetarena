import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"

import { normalizePlayerNamePart } from "@/lib/player-name"
import {
  INITIAL_RATING_MAX,
  INITIAL_RATING_MIN,
  INITIAL_RD_MAX,
  INITIAL_RD_MIN,
} from "@/lib/rating-defaults"

import { authed } from "../middleware/auth"
import {
  OrganizationLeagueSchema,
  requireLeagueAccess,
} from "./league-access.server"
import { getDb } from "../db/client"
import { createPlayerForLeague } from "./create-player.server"
import { deletePlayerForLeague } from "./delete-player.server"

const PlayerNamePartSchema = z
  .string()
  .transform(normalizePlayerNamePart)
  .pipe(z.string().min(1).max(100))

const CreatePlayerSchema = OrganizationLeagueSchema.extend({
  firstName: PlayerNamePartSchema,
  lastName: PlayerNamePartSchema,
  rating: z
    .number()
    .int("player.rating_out_of_range")
    .min(INITIAL_RATING_MIN, "player.rating_out_of_range")
    .max(INITIAL_RATING_MAX, "player.rating_out_of_range"),
  rd: z
    .number()
    .min(INITIAL_RD_MIN, "player.rd_out_of_range")
    .max(INITIAL_RD_MAX, "player.rd_out_of_range"),
})

const DeletePlayerSchema = OrganizationLeagueSchema.extend({
  playerId: z.string().min(1),
})

export const createPlayer = createServerFn({ method: "POST" })
  .middleware([authed])
  .validator(CreatePlayerSchema)
  .handler(async ({ context, data }) => {
    await requireLeagueAccess(getDb(), {
      organizationId: data.organizationId,
      leagueId: data.leagueId,
      userId: context.auth.user.id,
      permission: "play:manage",
    })
    return createPlayerForLeague(data)
  })

export const deletePlayer = createServerFn({ method: "POST" })
  .middleware([authed])
  .validator(DeletePlayerSchema)
  .handler(async ({ context, data }) => {
    await requireLeagueAccess(getDb(), {
      organizationId: data.organizationId,
      leagueId: data.leagueId,
      userId: context.auth.user.id,
      permission: "play:manage",
    })
    return deletePlayerForLeague(data)
  })

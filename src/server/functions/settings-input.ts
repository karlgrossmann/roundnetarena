import { z } from "zod"

import {
  INITIAL_RATING_MAX,
  INITIAL_RATING_MIN,
  INITIAL_RD_MAX,
  INITIAL_RD_MIN,
} from "@/lib/rating-defaults"
import { OrganizationLeagueSchema } from "./league-access.server"

const TableColumnSchema = z.enum([
  "rating",
  "rd",
  "gamesPlayed",
  "gamesWon",
  "gamesLost",
  "winPercentage",
  "totalRatingChange",
])

export const SettingsInputSchema = OrganizationLeagueSchema.extend({
  settings: z.object({
    matchingAlgorithm: z.enum(["default", "random"]),
    higherRatingWeight: z.number().min(0.5).max(4),
    pauseMode: z.enum(["random", "lowest_first"]),
    initialRating: z
      .number()
      .int("settings.initial_rating_out_of_range")
      .min(INITIAL_RATING_MIN, "settings.initial_rating_out_of_range")
      .max(INITIAL_RATING_MAX, "settings.initial_rating_out_of_range"),
    initialRd: z
      .number()
      .int("settings.initial_rd_out_of_range")
      .min(INITIAL_RD_MIN, "settings.initial_rd_out_of_range")
      .max(INITIAL_RD_MAX, "settings.initial_rd_out_of_range"),
    table: z.object({
      columns: z.array(TableColumnSchema).min(1),
      sortBy: TableColumnSchema,
      colorRatingChange: z.boolean(),
    }),
  }),
})

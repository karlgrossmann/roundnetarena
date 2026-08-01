import { z } from "zod"

import { validateCustomTimeRange } from "@/lib/time-range"
import type { TimeRange } from "@/lib/time-range"

const TimeRangePresetSchema = z.enum(["all", "four-weeks", "six-months"])

export const TimeRangeSchema = z.union([
  TimeRangePresetSchema,
  z
    .object({
      kind: z.literal("custom"),
      from: z.string(),
      to: z.string(),
    })
    .superRefine((range, context) => {
      const result = validateCustomTimeRange(range.from, range.to)
      if (!result.valid) {
        context.addIssue({
          code: "custom",
          message: result.issue.code,
        })
      }
    }),
])

/** Pins the Zod-derived boundary type explicitly to the domain type. */
export function statisticsRange(
  range: z.infer<typeof TimeRangeSchema>
): TimeRange {
  return range
}

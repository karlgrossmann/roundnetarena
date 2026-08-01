import { formatDelta, trendOf } from "@/lib/format"
import type { Trend } from "@/lib/format"
import { cn } from "@/lib/utils"

interface RatingDeltaProps {
  delta: number
  /** Preview before a round is committed — muted appearance. */
  preview?: boolean
  size?: "sm" | "md"
  className?: string
}

/** `destructive` stays reserved for dangerous actions — losing rating is not an error,
 *  so a loss uses `danger`. */
const TREND_CLASS: Record<Trend, string> = {
  up: "text-success",
  down: "text-danger",
  flat: "text-muted-foreground",
}

/** Signed rating change, colored by trend. */
export function RatingDelta({
  delta,
  preview = false,
  size = "md",
  className,
}: RatingDeltaProps) {
  return (
    <span
      className={cn(
        "font-medium tabular-nums",
        TREND_CLASS[trendOf(delta)],
        size === "sm" ? "text-xs" : "text-sm",
        preview && "opacity-60",
        className
      )}
    >
      {formatDelta(delta)}
    </span>
  )
}

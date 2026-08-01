import { formatRating, formatRd } from "@/lib/format"
import { cn } from "@/lib/utils"

interface RatingValueProps {
  rating: number
  /** Rating uncertainty. Only shown when passed. */
  rd?: number
  className?: string
}

export function RatingValue({ rating, rd, className }: RatingValueProps) {
  return (
    <span className={cn("tabular-nums", className)}>
      {formatRating(rating)}
      {rd !== undefined && (
        <span className="ml-1.5 text-xs font-normal text-muted-foreground">
          RD {formatRd(rd)}
        </span>
      )}
    </span>
  )
}

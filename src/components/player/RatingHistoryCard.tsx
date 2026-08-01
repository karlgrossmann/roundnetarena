import { RatingChart } from "./RatingChart"
import { TimeRangeFilter } from "@/components/TimeRangeFilter"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { MIN_CHART_POINTS, ratingRangeOptions } from "@/lib/player-view"
import type { TimeRange } from "@/lib/time-range"
import type { RatingPoint } from "@/lib/types"
import {
  common_retry,
  player_rating_history,
  player_rating_history_empty,
  player_rating_history_error,
  player_rating_range_label,
} from "@/paraglide/messages.js"

interface RatingHistoryCardProps {
  points: Array<RatingPoint>
  range: TimeRange
  onRangeChange: (range: TimeRange) => void
  isPending?: boolean
  isError?: boolean
  onRetry?: () => void
}

/** The time range also applies to the game list below — two separate selectors for the
 *  same question would be one too many. */
export function RatingHistoryCard({
  points,
  range,
  onRangeChange,
  isPending = false,
  isError = false,
  onRetry,
}: RatingHistoryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{player_rating_history()}</CardTitle>
        <CardAction>
          <TimeRangeFilter
            value={range}
            options={ratingRangeOptions()}
            onChange={onRangeChange}
            label={player_rating_range_label()}
            size="sm"
          />
        </CardAction>
      </CardHeader>

      <CardContent>
        {isPending ? (
          <Skeleton className="h-44 w-full" />
        ) : isError ? (
          <div className="flex min-h-24 flex-col items-start justify-center gap-2">
            <p className="text-sm text-destructive">
              {player_rating_history_error()}
            </p>
            <Button variant="outline" size="sm" onClick={onRetry}>
              {common_retry()}
            </Button>
          </div>
        ) : points.length >= MIN_CHART_POINTS ? (
          <RatingChart points={points} />
        ) : (
          <p className="text-sm text-muted-foreground">
            {player_rating_history_empty()}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

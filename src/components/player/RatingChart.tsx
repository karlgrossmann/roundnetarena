import { useId } from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceDot,
  XAxis,
  YAxis,
} from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import type { ChartConfig } from "@/components/ui/chart"
import { formatDayMonth, formatMonthShort, formatRating } from "@/lib/format"
import type { RatingPoint } from "@/lib/types"
import { column_rating } from "@/paraglide/messages.js"

interface RatingChartProps {
  /** Ascending by time, at least two points — see `filterRatingPoints()`. */
  points: Array<RatingPoint>
}

/**
 * The rating history.
 *
 * The Y axis does not start at zero: everything happens between roughly 1400 and 1650,
 * and a zero baseline would flatten the curve into a straight line. The last point is
 * highlighted — that is where the player stands today.
 */
export function RatingChart({ points }: RatingChartProps) {
  const chartConfig = {
    rating: { label: column_rating(), color: "var(--chart-1)" },
  } satisfies ChartConfig
  const gradientId = `rating-gradient-${useId().replace(/:/g, "")}`
  const last = points[points.length - 1]

  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-44 w-full">
      <AreaChart
        data={points}
        margin={{ top: 8, right: 8, bottom: 0, left: 8 }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor="var(--color-rating)"
              stopOpacity={0.28}
            />
            <stop
              offset="100%"
              stopColor="var(--color-rating)"
              stopOpacity={0}
            />
          </linearGradient>
        </defs>

        {/* Horizontal guides only — vertical ones cut the curve apart without
            explaining anything. */}
        <CartesianGrid vertical={false} />

        <XAxis
          dataKey="timestamp"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={24}
          tickFormatter={(value: string) => formatMonthShort(value)}
        />

        <YAxis hide domain={["dataMin - 15", "dataMax + 15"]} />

        <ChartTooltip
          content={
            <ChartTooltipContent
              hideIndicator
              labelFormatter={(value) => formatDayMonth(String(value))}
              formatter={(value) => (
                <span className="w-full text-right font-medium tabular-nums">
                  {formatRating(Number(value))}
                </span>
              )}
            />
          }
        />

        <Area
          dataKey="rating"
          type="monotone"
          stroke="var(--color-rating)"
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          dot={false}
          activeDot={{ r: 4 }}
        />

        <ReferenceDot
          x={last.timestamp}
          y={last.rating}
          r={4}
          fill="var(--color-rating)"
          stroke="none"
        />
      </AreaChart>
    </ChartContainer>
  )
}

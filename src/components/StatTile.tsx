import { Card, CardContent } from "@/components/ui/card"

interface StatTileProps {
  value: number
  label: string
}

/** Metric with a caption. The large number uses `tabular-nums` so four tiles side by
 *  side do not jitter. */
export function StatTile({ value, label }: StatTileProps) {
  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-0.5">
        <span className="font-heading text-2xl leading-none font-semibold tabular-nums">
          {value}
        </span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </CardContent>
    </Card>
  )
}

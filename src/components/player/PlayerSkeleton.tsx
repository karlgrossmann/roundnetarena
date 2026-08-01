import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

const PLACEHOLDER_ROWS = 5

/**
 * Loading state of `/player/$playerId`.
 *
 * Mirrors header, chart and list so nothing jumps once the data arrives.
 */
export function PlayerSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 shrink-0 rounded-full" />
            <div className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-28" />
            </div>
            <Skeleton className="h-10 w-20 shrink-0" />
          </div>

          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 4 }, (_value, index) => (
              <div key={index} className="flex flex-col gap-1.5">
                <Skeleton className="h-5 w-10" />
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-7 w-32" />
          </div>
          <Skeleton className="h-44 w-full" />
        </CardContent>
      </Card>

      <Card className="gap-0">
        <CardContent className="flex items-center justify-between pb-(--card-spacing)">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-4 w-24" />
        </CardContent>

        <ul className="divide-y border-t">
          {Array.from({ length: PLACEHOLDER_ROWS }, (_value, index) => (
            <li
              key={index}
              className="flex min-h-14 items-center gap-3 px-4 py-2.5"
            >
              <Skeleton className="size-7 shrink-0 rounded-md" />
              <div className="flex flex-1 flex-col gap-1.5">
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-8 w-14 shrink-0" />
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}

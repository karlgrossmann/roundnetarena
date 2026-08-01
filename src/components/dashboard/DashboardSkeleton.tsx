import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

/** Rows the skeleton hints at — enough to anticipate the card's height. */
const PLACEHOLDER_ROWS = 8

/**
 * Loading state of the dashboard.
 *
 * Mirrors the finished page's layout so nothing jumps once the data arrives. It shows on
 * navigation to this page — on the first request the server already ships the finished
 * page.
 */
export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Skeleton className="size-11 shrink-0 rounded-lg md:size-12" />
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Card key={index} size="sm">
            <CardContent className="flex flex-col gap-2">
              <Skeleton className="h-6 w-12" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="gap-0">
        <CardContent className="flex items-center justify-between pb-(--card-spacing)">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-7 w-24" />
        </CardContent>
        <CardContent className="flex items-center gap-2 pb-(--card-spacing)">
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 w-10 shrink-0 sm:w-40" />
        </CardContent>
        <div className="divide-y border-t">
          {Array.from({ length: PLACEHOLDER_ROWS }, (_, index) => (
            <div key={index} className="flex items-center gap-3 px-4 py-3.5">
              <Skeleton className="size-4 shrink-0" />
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-40" />
              </div>
              <Skeleton className="h-5 w-12 shrink-0" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

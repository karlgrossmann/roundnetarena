import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

/** Enough to hint at the later content without jumping once the data arrives. */
const PLACEHOLDER_GROUPS = 2
const PLACEHOLDER_ROWS = 3

/**
 * Loading state of `/history`. Seen when navigating to this page — on the first request
 * the server already delivers the finished page.
 */
export function HistorySkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-8 w-56" />

      {Array.from({ length: PLACEHOLDER_GROUPS }, (_group, group) => (
        <div key={group} className="flex flex-col gap-2">
          <Skeleton className="h-4 w-40" />

          <Card className="py-0">
            <ul className="divide-y">
              {Array.from({ length: PLACEHOLDER_ROWS }, (_row, row) => (
                <li
                  key={row}
                  className="flex min-h-14 items-center gap-3 px-4 py-2.5"
                >
                  <div className="flex flex-1 flex-col gap-1.5">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <Skeleton className="h-4 w-10 shrink-0" />
                </li>
              ))}
            </ul>
          </Card>
        </div>
      ))}
    </div>
  )
}

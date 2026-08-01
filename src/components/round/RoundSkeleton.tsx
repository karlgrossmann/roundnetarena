import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

/** Enough tiles to anticipate the card height. */
const PLACEHOLDER_TILES = 12

/**
 * Loading state of `/round`.
 *
 * Mirrors the pool view's grid so nothing jumps when the data arrives. Visible when
 * navigating to this page — on the first request the server already ships the full page.
 */
export function RoundSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Card className="gap-0">
        <CardContent className="flex flex-col gap-1.5 pb-(--card-spacing)">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-32" />
        </CardContent>

        {/* Last block of the card — the card itself supplies the `pb`. */}
        <CardContent>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {Array.from({ length: PLACEHOLDER_TILES }, (_, index) => (
              <Skeleton key={index} className="h-11 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center gap-4">
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-11 w-28 shrink-0" />
        </CardContent>
      </Card>

      <Card className="py-0">
        <div className="px-4 py-3">
          <Skeleton className="h-6 w-52" />
        </div>
      </Card>
    </div>
  )
}

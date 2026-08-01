import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { SettingsTab } from "@/lib/settings-tabs"

const PLACEHOLDER_GROUPS: Record<SettingsTab, ReadonlyArray<number>> = {
  account: [2, 1, 1, 1],
  organization: [2, 2, 4, 2],
  league: [2, 1, 2, 3],
}

/**
 * Loading state of `/settings`. Only seen when navigating here — the first visit is
 * already served rendered by the server.
 */
export function SettingsSkeleton({ tab = "account" }: { tab?: SettingsTab }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex h-11 w-full gap-1 rounded-lg bg-muted p-1 md:w-96">
        {Array.from({ length: 3 }, (_value, index) => (
          <Skeleton key={index} className="h-full flex-1" />
        ))}
      </div>

      {PLACEHOLDER_GROUPS[tab].map((rows, group) => (
        <div key={group} className="flex flex-col gap-2">
          <Skeleton className="h-4 w-24" />

          <Card className="py-0">
            <div className="divide-y">
              {Array.from({ length: rows }, (_value, row) => (
                <div
                  key={row}
                  className="flex min-h-14 items-center gap-3 px-4 py-2.5"
                >
                  <div className="flex flex-1 flex-col gap-1.5">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-56" />
                  </div>
                  <Skeleton className="h-4 w-16 shrink-0" />
                </div>
              ))}
            </div>
          </Card>
        </div>
      ))}
    </div>
  )
}

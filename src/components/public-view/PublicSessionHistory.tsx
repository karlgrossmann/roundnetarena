import { useMemo, useState } from "react"
import { IconHistory } from "@/components/icons"
import { useQuery } from "@tanstack/react-query"

import { usePublicViewContext } from "./PublicViewContext"
import { SessionDayCard } from "@/components/history/SessionDayCard"
import { TimeRangeFilter } from "@/components/TimeRangeFilter"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Spinner } from "@/components/ui/spinner"
import { useNow } from "@/hooks/use-now"
import { publicViewHistoryQueryOptions } from "@/lib/api/queries"
import {
  countRounds,
  historyRangeOptions,
  sessionDayLabel,
  sortSessionDays,
} from "@/lib/history"
import type { TimeRange } from "@/lib/time-range"
import {
  common_retry,
  history_empty_description,
  history_empty_title,
  history_loading_label,
  history_loading_range,
  history_range_empty,
  history_range_empty_description,
  history_range_error,
  history_range_error_description,
} from "@/paraglide/messages.js"

export function PublicSessionHistory() {
  const view = usePublicViewContext()
  const now = useNow()
  const [range, setRange] = useState<TimeRange>("all")
  const history = useQuery(publicViewHistoryQueryOptions(view, range))
  const sorted = useMemo(
    () => sortSessionDays(history.data ?? []),
    [history.data]
  )

  if (
    !history.isPending &&
    !history.isError &&
    range === "all" &&
    countRounds(sorted) === 0
  ) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <IconHistory />
          </EmptyMedia>
          <EmptyTitle>{history_empty_title()}</EmptyTitle>
          <EmptyDescription>{history_empty_description()}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <TimeRangeFilter
        value={range}
        options={historyRangeOptions()}
        onChange={setRange}
      />
      {history.isPending ? (
        <div className="flex min-h-40 items-center justify-center gap-2 rounded-lg border text-sm text-muted-foreground">
          <Spinner aria-label={history_loading_label()} />
          {history_loading_range()}
        </div>
      ) : history.isError ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>{history_range_error()}</EmptyTitle>
            <EmptyDescription>
              {history_range_error_description()}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => void history.refetch()}>
              {common_retry()}
            </Button>
          </EmptyContent>
        </Empty>
      ) : sorted.length > 0 ? (
        sorted.map((day) => (
          <SessionDayCard
            key={day.date}
            day={day}
            label={sessionDayLabel(day, now)}
            activeRoundLink={{
              mode: "public",
              organizationSlug: view.organizationSlug,
              leagueId: view.leagueId,
            }}
          />
        ))
      ) : (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>{history_range_empty()}</EmptyTitle>
            <EmptyDescription>
              {history_range_empty_description()}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  )
}

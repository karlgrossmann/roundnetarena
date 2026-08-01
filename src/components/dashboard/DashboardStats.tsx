import { StatTile } from "@/components/StatTile"
import type { DashboardSummary } from "@/lib/types"
import {
  dashboard_stat_games_today,
  dashboard_stat_games_total,
  dashboard_stat_players,
  dashboard_stat_rounds,
} from "@/paraglide/messages.js"

/** The dashboard's four key figures: a two-column grid below `md`, four from `md` up. */
export function DashboardStats({ summary }: { summary: DashboardSummary }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <StatTile value={summary.playerCount} label={dashboard_stat_players()} />
      <StatTile
        value={summary.gamesTotal}
        label={dashboard_stat_games_total()}
      />
      <StatTile
        value={summary.gamesToday}
        label={dashboard_stat_games_today()}
      />
      <StatTile value={summary.sessionCount} label={dashboard_stat_rounds()} />
    </div>
  )
}

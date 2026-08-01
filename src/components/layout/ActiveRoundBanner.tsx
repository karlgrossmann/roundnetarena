import { Link } from "@tanstack/react-router"

import { useLeagueContext } from "@/components/league/LeagueContext"
import { buttonVariants } from "@/components/ui/button"
import {
  active_round_complete,
  active_round_continue,
  active_round_progress,
  active_round_title,
} from "@/paraglide/messages.js"

interface ActiveRoundBannerProps {
  number: number
  openGames: number
  totalGames: number
}

/**
 * Pointer to a running round — an open round must never be invisible, or results get
 * lost.
 *
 * The whole area is a single link. "Continue" is therefore only styled like a button:
 * a real button inside the link would be a nested control and a trap for keyboard and
 * screen reader users.
 */
export function ActiveRoundBanner({
  number,
  openGames,
  totalGames,
}: ActiveRoundBannerProps) {
  const league = useLeagueContext()
  return (
    <Link
      to="/o/$organizationSlug/l/$leagueId/round"
      params={{
        organizationSlug: league.organizationSlug,
        leagueId: league.id,
      }}
      className="flex items-center gap-3 rounded-xl bg-primary/5 px-4 py-3 ring-1 ring-primary/20 transition-colors hover:bg-primary/10"
    >
      <span
        aria-hidden="true"
        className="size-2 shrink-0 animate-pulse rounded-full bg-primary"
      />

      <span className="min-w-0 flex-1">
        <span className="block font-heading text-sm font-medium">
          {active_round_title({ number })}
        </span>
        <span className="block text-sm text-muted-foreground">
          {openGames > 0
            ? active_round_progress({ open: openGames, total: totalGames })
            : active_round_complete()}
        </span>
      </span>

      <span aria-hidden="true" className={buttonVariants({ size: "sm" })}>
        {active_round_continue()}
      </span>
    </Link>
  )
}

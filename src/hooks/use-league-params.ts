import { useParams } from "@tanstack/react-router"

import type { NavParams } from "@/components/layout/navigation"

/**
 * Organization and league from the current route, or `null` outside a league.
 *
 * `strict: false` is required because the shell lives in `__root.tsx`, where no route
 * guarantees these params.
 */
export function useLeagueParams(): NavParams | null {
  const params = useParams({ strict: false })

  if (
    !("organizationSlug" in params) ||
    typeof params.organizationSlug !== "string" ||
    !("leagueId" in params) ||
    typeof params.leagueId !== "string"
  ) {
    return null
  }

  return {
    organizationSlug: params.organizationSlug,
    leagueId: params.leagueId,
  }
}

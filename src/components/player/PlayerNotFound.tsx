import { IconUserQuestion } from "@/components/icons"
import { Link } from "@tanstack/react-router"

import { Button } from "@/components/ui/button"
import { useLeagueContext } from "@/components/league/LeagueContext"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  not_found_back,
  player_not_found_description,
  player_not_found_title,
} from "@/paraglide/messages.js"

/** An unknown ID is not a crash but a dead-end path — so it needs a way back rather
 *  than a retry. */
export function PlayerNotFound() {
  const league = useLeagueContext()
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <IconUserQuestion />
        </EmptyMedia>
        <EmptyTitle>{player_not_found_title()}</EmptyTitle>
        <EmptyDescription>{player_not_found_description()}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button
          render={
            <Link
              to="/o/$organizationSlug/l/$leagueId"
              params={{
                organizationSlug: league.organizationSlug,
                leagueId: league.id,
              }}
            />
          }
        >
          {not_found_back()}
        </Button>
      </EmptyContent>
    </Empty>
  )
}

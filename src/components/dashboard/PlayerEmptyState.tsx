import { IconUsers } from "@/components/icons"

import { CreatePlayerButton } from "@/components/player/CreatePlayerButton"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import type { Settings } from "@/lib/types"
import {
  leaderboard_empty_description,
  leaderboard_empty_title,
} from "@/paraglide/messages.js"

/**
 * Takes the table's place while the group contains nobody.
 *
 * With players, the same button sits at the top of the table card — here it is centered,
 * because there would be nothing else to see.
 */
export function PlayerEmptyState({ settings }: { settings: Settings }) {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <IconUsers />
        </EmptyMedia>
        <EmptyTitle>{leaderboard_empty_title()}</EmptyTitle>
        <EmptyDescription>{leaderboard_empty_description()}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <CreatePlayerButton
          initialRating={settings.initialRating}
          initialRd={settings.initialRd}
        />
      </EmptyContent>
    </Empty>
  )
}

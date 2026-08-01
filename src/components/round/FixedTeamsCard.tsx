import { useMemo, useState } from "react"
import { IconLink, IconUnlink } from "@/components/icons"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { FixedTeam, PlayerRef, PoolEntry } from "@/lib/types"
import { playerRefDisplayName } from "@/lib/player-display"
import {
  common_active,
  common_inactive_saved,
  common_unknown,
  round_fixed_team_connect,
  round_fixed_team_first,
  round_fixed_team_remove,
  round_fixed_team_second,
  round_fixed_teams_description,
  round_fixed_teams_title,
} from "@/paraglide/messages.js"

interface FixedTeamsCardProps {
  entries: Array<PoolEntry>
  teams: Array<FixedTeam>
  onCreate: (first: PlayerRef, second: PlayerRef) => void
  onRemove: (teamId: string) => void
}

export function FixedTeamsCard({
  entries,
  teams,
  onCreate,
  onRemove,
}: FixedTeamsCardProps) {
  const [firstId, setFirstId] = useState<string | null>(null)
  const [secondId, setSecondId] = useState<string | null>(null)
  const present = entries.filter((entry) => entry.status !== "absent")
  const byId = new Map(entries.map((entry) => [entry.player.id, entry]))

  function createTeam() {
    const first = byId.get(firstId ?? "")?.player
    const second = byId.get(secondId ?? "")?.player
    if (!first || !second || first.id === second.id) return
    onCreate(first, second)
    setFirstId(null)
    setSecondId(null)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{round_fixed_teams_title()}</CardTitle>
        <CardDescription>{round_fixed_teams_description()}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {teams.map((team) => {
          const first = byId.get(team.players[0])
          const second = byId.get(team.players[1])
          const active =
            first?.status === "playing" && second?.status === "playing"
          return (
            <div
              key={team.id}
              className="flex items-center gap-2 rounded-lg border px-3 py-2"
            >
              <IconLink className="size-4 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate">
                {first ? playerRefDisplayName(first.player) : common_unknown()}{" "}
                &{" "}
                {second
                  ? playerRefDisplayName(second.player)
                  : common_unknown()}
              </span>
              <span
                className={
                  active
                    ? "text-xs text-success"
                    : "text-xs text-muted-foreground"
                }
              >
                {active ? common_active() : common_inactive_saved()}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={round_fixed_team_remove()}
                onClick={() => onRemove(team.id)}
              >
                <IconUnlink />
              </Button>
            </div>
          )
        })}

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <PlayerSelect
            label={round_fixed_team_first()}
            value={firstId}
            entries={present}
            onChange={setFirstId}
          />
          <PlayerSelect
            label={round_fixed_team_second()}
            value={secondId}
            entries={present}
            onChange={setSecondId}
          />
          <Button
            type="button"
            variant="outline"
            disabled={!firstId || !secondId || firstId === secondId}
            onClick={createTeam}
          >
            <IconLink />
            {round_fixed_team_connect()}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

interface PlayerSelectProps {
  label: string
  value: string | null
  entries: Array<PoolEntry>
  onChange: (value: string | null) => void
}

function PlayerSelect({ label, value, entries, onChange }: PlayerSelectProps) {
  // Without `items` the closed trigger shows the player id instead of the name.
  const items = useMemo(
    () =>
      Object.fromEntries(
        entries.map((entry) => [
          entry.player.id,
          playerRefDisplayName(entry.player),
        ])
      ),
    [entries]
  )

  return (
    <Select items={items} value={value} onValueChange={onChange}>
      {/* The label lives only in the placeholder — after a selection the trigger would
          otherwise lose its accessible name. */}
      <SelectTrigger className="h-11 w-full" aria-label={label}>
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        {entries.map((entry) => (
          <SelectItem key={entry.player.id} value={entry.player.id}>
            {playerRefDisplayName(entry.player)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

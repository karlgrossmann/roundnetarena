import { useState } from "react"
import { IconUsers } from "@/components/icons"
import { useSuspenseQuery } from "@tanstack/react-query"

import { CourtsCard } from "./CourtsCard"
import { FixedTeamsCard } from "./FixedTeamsCard"
import { PausePreview } from "./PausePreview"
import { PoolCard } from "./PoolCard"
import { StalePoolNotice } from "./StalePoolNotice"
import { StickyActionBar } from "@/components/layout/StickyActionBar"
import { useLeagueContext } from "@/components/league/LeagueContext"
import { CreatePlayerPanel } from "@/components/player/CreatePlayerPanel"
import { Alert, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { useGenerateRound } from "@/hooks/use-generate-round"
import { useNow } from "@/hooks/use-now"
import { usePoolActions } from "@/hooks/use-pool"
import {
  playersQueryOptions,
  poolQueryOptions,
  settingsQueryOptions,
} from "@/lib/api/queries"
import {
  countPoolStatus,
  effectiveCourts,
  generateRoundHint,
  poolEntriesForPlayers,
} from "@/lib/pool"
import { canStartRound, isPoolStale, maxCourts } from "@/lib/round"
import type { Player, Pool, Settings } from "@/lib/types"
import {
  player_create,
  round_create,
  round_create_error,
  round_create_pending,
  round_guest_description,
  round_guest_title,
  round_no_players_description,
  round_no_players_title,
  round_pool_save_error,
} from "@/paraglide/messages.js"

/**
 * `/round` without a running round: who plays today, on how many courts?
 *
 * The data is already in the cache — the route loader fetched it. Only the pause preview
 * loads on its own, because it depends on the court count chosen here.
 */
export function RoundPool() {
  const league = useLeagueContext()
  const { data: pool } = useSuspenseQuery(poolQueryOptions(league))
  const { data: players } = useSuspenseQuery(playersQueryOptions(league))
  const { data: settings } = useSuspenseQuery(settingsQueryOptions(league))

  const poolActions = usePoolActions()
  const generateRound = useGenerateRound()
  const now = useNow()

  /** `null` means "follow the recommendation" — see `effectiveCourts()`. */
  const [chosenCourts, setChosenCourts] = useState<number | null>(null)
  const [guestOpen, setGuestOpen] = useState(false)
  const [staleAccepted, setStaleAccepted] = useState(false)

  const entries = poolEntriesForPlayers(players, pool)
  const counts = countPoolStatus(entries)
  const courts = effectiveCourts(chosenCourts, counts.playing)

  // The pool as the page shows it: players without an entry count as absent.
  const shownPool: Pool = {
    updatedAt: pool.updatedAt,
    entries,
    fixedTeams: pool.fixedTeams,
  }
  const canStart = canStartRound(shownPool)

  const isStale =
    now !== null &&
    !staleAccepted &&
    counts.playing + counts.paused > 0 &&
    isPoolStale(pool, now)

  function addGuestToPool(player: Player) {
    poolActions.setStatus(
      {
        id: player.id,
        displayName: player.displayName,
        rating: player.rating,
      },
      "playing"
    )
  }

  function handleGenerate() {
    generateRound.mutate({
      courts,
    })
  }

  if (players.length === 0) {
    return (
      <>
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <IconUsers />
            </EmptyMedia>
            <EmptyTitle>{round_no_players_title()}</EmptyTitle>
            <EmptyDescription>
              {round_no_players_description()}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => setGuestOpen(true)}>
              {player_create()}
            </Button>
          </EmptyContent>
        </Empty>

        <GuestPanel
          open={guestOpen}
          onOpenChange={setGuestOpen}
          settings={settings}
          onCreated={addGuestToPool}
        />
      </>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {isStale && (
        <StalePoolNotice
          updatedAt={pool.updatedAt}
          onKeep={() => setStaleAccepted(true)}
          onRestart={() => {
            poolActions.clear()
            setStaleAccepted(true)
          }}
        />
      )}

      {poolActions.isError && (
        <Alert variant="destructive">
          <AlertTitle>{round_pool_save_error()}</AlertTitle>
        </Alert>
      )}

      <PoolCard
        entries={entries}
        onToggle={(player, next) => poolActions.setStatus(player, next)}
        onAddAll={() => poolActions.addAll(players)}
        onClear={() => poolActions.clear()}
        onAddGuest={() => setGuestOpen(true)}
      />

      <FixedTeamsCard
        entries={entries}
        teams={pool.fixedTeams}
        onCreate={poolActions.setFixedTeam}
        onRemove={poolActions.removeFixedTeam}
      />

      <CourtsCard
        courts={courts}
        max={maxCourts(counts.playing)}
        playingCount={counts.playing}
        onChange={setChosenCourts}
      />

      <PausePreview courts={courts} playingCount={counts.playing} />

      {generateRound.isError && (
        <Alert variant="destructive">
          <AlertTitle>{round_create_error()}</AlertTitle>
        </Alert>
      )}

      <StickyActionBar hint={generateRoundHint(counts.playing, courts)}>
        <Button
          size="lg"
          className="h-12 w-full"
          disabled={!canStart || generateRound.isPending}
          onClick={handleGenerate}
        >
          {generateRound.isPending ? round_create_pending() : round_create()}
        </Button>
      </StickyActionBar>

      <GuestPanel
        open={guestOpen}
        onOpenChange={setGuestOpen}
        settings={settings}
        onCreated={addGuestToPool}
      />
    </div>
  )
}

interface GuestPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  settings: Settings
  onCreated: (player: Player) => void
}

/**
 * The same input as on the overview, but without the detour through player management:
 * on a match day someone new shows up regularly, and the long way there costs too much
 * time exactly then. Whoever is created here joins the pool right away.
 */
function GuestPanel({
  open,
  onOpenChange,
  settings,
  onCreated,
}: GuestPanelProps) {
  return (
    <CreatePlayerPanel
      open={open}
      onOpenChange={onOpenChange}
      initialRating={settings.initialRating}
      initialRd={settings.initialRd}
      title={round_guest_title()}
      description={round_guest_description()}
      onCreated={onCreated}
    />
  )
}

import { useId, useRef, useState } from "react"
import type { FormEvent } from "react"
import { IconAlertTriangle } from "@/components/icons"

import { ScoreInput } from "./ScoreInput"
import { ResponsivePanel } from "@/components/layout/ResponsivePanel"
import { Button } from "@/components/ui/button"
import { domainIssue } from "@/lib/domain-errors"
import { translateDomainIssue } from "@/lib/i18n"
import { parseScoreInput, validateScore } from "@/lib/score"
import { playerRefDisplayName } from "@/lib/player-display"
import type { Game } from "@/lib/types"
import {
  common_cancel,
  common_save,
  game_court,
  score_confirm_warning,
  score_description,
  score_save_anyway,
} from "@/paraglide/messages.js"

interface ScoreSheetProps {
  game: Game | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (pointsA: number, pointsB: number) => void
}

/**
 * Score entry for a game.
 *
 * The form starts fresh on every open — with the previous values when correcting, empty
 * otherwise. Instead of syncing that state in an effect, the form hangs on a `key`:
 * switching games or reopening resets it.
 */
export function ScoreSheet({
  game,
  open,
  onOpenChange,
  onSubmit,
}: ScoreSheetProps) {
  return (
    <ResponsivePanel
      open={open && game !== null}
      onOpenChange={onOpenChange}
      title={game ? game_court({ court: game.court }) : ""}
      description={score_description()}
    >
      {game && (
        <ScoreForm
          key={`${game.id}:${String(open)}`}
          game={game}
          onCancel={() => onOpenChange(false)}
          onSubmit={onSubmit}
        />
      )}
    </ResponsivePanel>
  )
}

interface ScoreFormProps {
  game: Game
  onCancel: () => void
  onSubmit: (pointsA: number, pointsB: number) => void
}

function initialPoints(points: number | undefined): string {
  return points === undefined ? "" : String(points)
}

function ScoreForm({ game, onCancel, onSubmit }: ScoreFormProps) {
  const id = useId()
  const [pointsA, setPointsA] = useState(() =>
    initialPoints(game.result?.pointsA)
  )
  const [pointsB, setPointsB] = useState(() =>
    initialPoints(game.result?.pointsB)
  )
  /** Messages appear only after the first submit — not while typing. */
  const [attempted, setAttempted] = useState(false)
  /** Which score the warning was already confirmed for. A changed score needs a fresh
   *  confirmation. */
  const [confirmed, setConfirmed] = useState<string | null>(null)
  const teamBField = useRef<HTMLInputElement>(null)

  /** After two typed digits the first score is settled — focus moves on instead of
   *  demanding a reach for Tab courtside. When correcting, the existing value is selected
   *  so typing replaces it. */
  function focusTeamB() {
    teamBField.current?.focus()
    teamBField.current?.select()
  }

  const parsed = parseScoreInput(pointsA, pointsB)
  const validation = parsed
    ? validateScore(parsed.pointsA, parsed.pointsB)
    : null

  const errors = parsed
    ? (validation?.errors ?? [])
    : [domainIssue("score.required")]
  const warnings = validation?.warnings ?? []

  const current = `${pointsA}:${pointsB}`
  const showErrors = attempted && errors.length > 0
  const showWarnings = attempted && errors.length === 0 && warnings.length > 0

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setAttempted(true)

    if (!parsed || errors.length > 0) return

    // Warnings don't block, they ask back: unusual results do happen.
    if (warnings.length > 0 && confirmed !== current) {
      setConfirmed(current)
      return
    }

    onSubmit(parsed.pointsA, parsed.pointsB)
  }

  const leading = parsed ? (parsed.pointsA > parsed.pointsB ? "a" : "b") : null

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div className="flex items-stretch gap-2">
        <ScoreInput
          id={`${id}-a`}
          names={game.teamA.players.map(playerRefDisplayName)}
          value={pointsA}
          onChange={setPointsA}
          onFilled={focusTeamB}
          invalid={showErrors}
          leading={leading === "a"}
        />

        <span className="self-center text-lg text-muted-foreground">:</span>

        <ScoreInput
          id={`${id}-b`}
          ref={teamBField}
          names={game.teamB.players.map(playerRefDisplayName)}
          value={pointsB}
          onChange={setPointsB}
          invalid={showErrors}
          leading={leading === "b"}
        />
      </div>

      {showErrors && (
        <p role="alert" className="text-sm text-destructive">
          {errors.map((issue) => translateDomainIssue(issue)).join(" ")}
        </p>
      )}

      {showWarnings && (
        <div
          role="alert"
          className="flex gap-2 rounded-lg border border-primary/40 bg-primary/5 px-3 py-2 text-sm"
        >
          <IconAlertTriangle
            aria-hidden
            className="mt-0.5 size-4 shrink-0 text-primary"
          />
          <span>
            {warnings.map((issue) => translateDomainIssue(issue)).join(" ")}{" "}
            {score_confirm_warning()}
          </span>
        </div>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          {common_cancel()}
        </Button>
        <Button type="submit">
          {showWarnings ? score_save_anyway() : common_save()}
        </Button>
      </div>
    </form>
  )
}

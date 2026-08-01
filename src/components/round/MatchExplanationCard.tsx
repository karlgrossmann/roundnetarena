import { IconChevronDown } from "@/components/icons"

import { Card } from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatMatchCost, formatMatchCostDelta } from "@/lib/format"
import { playerRefDisplayName } from "@/lib/player-display"
import type {
  MatchExplanation,
  MatchExplanationCriterion,
  PlayerId,
  PlayerRef,
} from "@/lib/types"
import {
  match_criterion_rating_range,
  match_criterion_repetitions,
  match_criterion_team_difference,
  match_explanation_chosen,
  match_explanation_cost,
  match_explanation_court,
  match_explanation_description,
  match_explanation_empty,
  match_explanation_lineup,
  match_explanation_surcharge,
  match_explanation_title,
} from "@/paraglide/messages.js"

/**
 * "Why these matchups?" — collapsed by default, since the question comes up rarely.
 *
 * Lower cost is better; the chosen lineup is the first row.
 */
export function MatchExplanationCard({
  explanation,
  players,
}: {
  explanation: MatchExplanation
  players: Array<PlayerRef>
}) {
  const playerNames = new Map(
    players.map((player) => [player.id, playerRefDisplayName(player)])
  )

  return (
    <Card className="gap-0 py-0">
      <Collapsible>
        <CollapsibleTrigger className="group/explanation flex w-full items-center gap-2 rounded-xl px-4 py-3 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          <span className="flex-1 font-heading text-base font-medium">
            {match_explanation_title()}
          </span>
          <IconChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[panel-open]/explanation:rotate-180" />
        </CollapsibleTrigger>

        <CollapsibleContent className="border-t px-4 py-3">
          <p className="mb-2 text-sm text-muted-foreground">
            {match_explanation_description()}
          </p>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{match_explanation_lineup()}</TableHead>
                <TableHead className="text-right">
                  {match_explanation_cost()}
                </TableHead>
                <TableHead className="text-right">
                  {match_explanation_surcharge()}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">
                  <span className="block">{match_explanation_chosen()}</span>
                  <Lineup
                    matchups={explanation.chosen.matchups}
                    playerNames={playerNames}
                  />
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatMatchCost(explanation.chosen.cost)}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  —
                </TableCell>
              </TableRow>

              {explanation.alternatives.map((alternative) => (
                <TableRow key={alternative.id}>
                  <TableCell>
                    <span className="block font-medium">
                      {criterionLabel(alternative.id)}
                    </span>
                    <Lineup
                      matchups={alternative.matchups}
                      playerNames={playerNames}
                    />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMatchCost(alternative.cost)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMatchCostDelta(alternative.costDelta)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {explanation.alternatives.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              {match_explanation_empty()}
            </p>
          ) : null}
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

function Lineup({
  matchups,
  playerNames,
}: {
  matchups: MatchExplanation["chosen"]["matchups"]
  playerNames: Map<PlayerId, string>
}) {
  return (
    <span className="mt-1 flex flex-col gap-0.5 text-xs text-muted-foreground">
      {matchups.map((matchup, index) => (
        <span key={`${matchup.teamA.join("-")}-${matchup.teamB.join("-")}`}>
          {match_explanation_court({
            court: index + 1,
            teamA: teamLabel(matchup.teamA, playerNames),
            teamB: teamLabel(matchup.teamB, playerNames),
          })}
        </span>
      ))}
    </span>
  )
}

function teamLabel(
  team: [PlayerId, PlayerId],
  playerNames: Map<PlayerId, string>
): string {
  return team
    .map((playerId) => playerNames.get(playerId) ?? playerId)
    .join(" + ")
}

function criterionLabel(criterion: MatchExplanationCriterion): string {
  if (criterion === "ratingRange") return match_criterion_rating_range()
  if (criterion === "teamDifference") {
    return match_criterion_team_difference()
  }
  return match_criterion_repetitions()
}

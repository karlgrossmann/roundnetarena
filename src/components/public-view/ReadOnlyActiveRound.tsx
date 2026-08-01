import { GameCard } from "@/components/game/GameCard"
import { MatchExplanationCard } from "@/components/round/MatchExplanationCard"
import { PausingCard } from "@/components/round/PausingCard"
import { RoundProgressCard } from "@/components/round/RoundProgressCard"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { sortGamesByCourt } from "@/lib/round-view"
import type { Round } from "@/lib/types"
import { public_view_read_only_notice } from "@/paraglide/messages.js"

export function ReadOnlyActiveRound({ round }: { round: Round }) {
  return (
    <div className="flex flex-col gap-4">
      <Alert>
        <AlertDescription>{public_view_read_only_notice()}</AlertDescription>
      </Alert>
      <RoundProgressCard round={round} />
      <div className="grid gap-4 md:grid-cols-2">
        {sortGamesByCourt(round.games).map((game) => (
          <GameCard key={game.id} game={game} preview readOnly />
        ))}
      </div>
      <PausingCard pausing={round.pausing} />
      {round.explanation ? (
        <MatchExplanationCard
          explanation={round.explanation}
          players={round.games.flatMap((game) => [
            ...game.teamA.players,
            ...game.teamB.players,
          ])}
        />
      ) : null}
    </div>
  )
}

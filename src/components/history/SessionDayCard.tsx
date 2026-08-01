import { HistoryRoundRow } from "./HistoryRoundRow"
import { SectionLabel } from "@/components/SectionLabel"
import { Card } from "@/components/ui/card"
import type { SessionDay } from "@/lib/types"

interface SessionDayCardProps {
  day: SessionDay
  /** Localized day label — comes from `sessionDayLabel()`. */
  label: string
  activeRoundLink: ActiveRoundLink
}

export type ActiveRoundLink =
  | {
      mode: "member"
      organizationSlug: string
      leagueId: string
    }
  | {
      mode: "public"
      organizationSlug: string
      leagueId: string
    }

/** One session day: a heading with a card below holding one row per round. */
export function SessionDayCard({
  day,
  label,
  activeRoundLink,
}: SessionDayCardProps) {
  return (
    <section className="flex flex-col gap-2">
      <SectionLabel>{label}</SectionLabel>

      <Card className="py-0">
        <ul className="divide-y">
          {day.rounds.map((round) => (
            <li key={round.id}>
              <HistoryRoundRow
                round={round}
                activeRoundLink={activeRoundLink}
              />
            </li>
          ))}
        </ul>
      </Card>
    </section>
  )
}

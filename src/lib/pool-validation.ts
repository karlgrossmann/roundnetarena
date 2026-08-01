import type { Pool } from "./types"
import { domainIssue } from "./domain-errors"
import type { DomainIssue } from "./domain-errors"

export function validatePool(pool: Pool): Array<DomainIssue> {
  const errors: Array<DomainIssue> = []
  const entryIds = pool.entries.map((entry) => entry.player.id)
  const entryIdSet = new Set(entryIds)
  if (new Set(entryIds).size !== entryIds.length) {
    errors.push(domainIssue("pool.duplicate_player"))
  }

  const assigned = new Set<string>()
  const teamIds = new Set<string>()
  pool.fixedTeams.forEach((team) => {
    if (teamIds.has(team.id)) {
      errors.push(domainIssue("pool.duplicate_fixed_team"))
    }
    teamIds.add(team.id)
    if (team.players[0] === team.players[1]) {
      errors.push(domainIssue("pool.fixed_team_distinct_players"))
      return
    }
    team.players.forEach((playerId) => {
      if (assigned.has(playerId)) {
        errors.push(domainIssue("pool.player_in_multiple_fixed_teams"))
      }
      assigned.add(playerId)
      if (!entryIdSet.has(playerId)) {
        errors.push(domainIssue("pool.fixed_team_player_missing"))
      }
    })
  })
  return errors.filter(
    (error, index) =>
      errors.findIndex((candidate) => candidate.code === error.code) === index
  )
}

import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"

import { DomainError } from "@/lib/domain-errors"
import { hasOrganizationPermission } from "@/lib/organization-permissions"
import type { LeagueContext } from "@/lib/types"

import {
  OrganizationLeagueSchema,
  requireLeagueAccess,
} from "./league-access.server"
import { getDb } from "../db/client"
import { createId } from "../db/ids"
import { authed } from "../middleware/auth"
import { provisionLeagueDefaults } from "../repositories/organization-onboarding"
import {
  findLeaguesForOrganization,
  insertLeague,
  LeagueNameConstraintError,
} from "../repositories/leagues"
import { findOrganizationMembership } from "../repositories/organizations"

const OrganizationSchema = z.object({ organizationId: z.uuid() })
const LeagueContextSchema = OrganizationLeagueSchema.extend({
  organizationSlug: z.string().min(1),
})
const CreateLeagueSchema = OrganizationSchema.extend({
  name: z.string().trim().min(2).max(100),
})

export const fetchLeagues = createServerFn({ method: "GET" })
  .middleware([authed])
  .validator(OrganizationSchema)
  .handler(async ({ context, data }) => {
    await requireOrganizationMembership(
      getDb(),
      data.organizationId,
      context.auth.user.id
    )
    return findLeaguesForOrganization(getDb(), data.organizationId)
  })

export const fetchLeagueContext = createServerFn({ method: "GET" })
  .middleware([authed])
  .validator(LeagueContextSchema)
  .handler(async ({ context, data }): Promise<LeagueContext> => {
    const league = await requireLeagueAccess(getDb(), {
      organizationId: data.organizationId,
      leagueId: data.leagueId,
      userId: context.auth.user.id,
    })
    if (league.organizationSlug !== data.organizationSlug) {
      throw new DomainError("league.not_found")
    }
    return league
  })

export const createLeague = createServerFn({ method: "POST" })
  .middleware([authed])
  .validator(CreateLeagueSchema)
  .handler(async ({ context, data }): Promise<LeagueContext> => {
    const database = getDb()
    try {
      return await database.transaction(async (tx) => {
        const role = await requireOrganizationMembership(
          tx,
          data.organizationId,
          context.auth.user.id
        )
        if (!hasOrganizationPermission(role, "league:manage")) {
          throw new DomainError("league.forbidden")
        }

        const leagueId = createId("league")
        await insertLeague(tx, {
          id: leagueId,
          organizationId: data.organizationId,
          name: data.name.trim(),
        })
        await provisionLeagueDefaults(tx, leagueId)
        return requireLeagueAccess(tx, {
          organizationId: data.organizationId,
          leagueId,
          userId: context.auth.user.id,
        })
      })
    } catch (error) {
      if (error instanceof LeagueNameConstraintError) {
        throw new DomainError("league.name_taken")
      }
      throw error
    }
  })

async function requireOrganizationMembership(
  executor: Parameters<typeof findOrganizationMembership>[0],
  organizationId: string,
  userId: string
) {
  const membership = await findOrganizationMembership(
    executor,
    organizationId,
    userId
  )
  if (!membership) throw new DomainError("organization.forbidden")
  return membership.role
}

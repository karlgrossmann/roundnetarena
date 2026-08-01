import "@tanstack/react-start/server-only"

import { z } from "zod"

import { DomainError } from "@/lib/domain-errors"
import {
  hasOrganizationPermission,
  isOrganizationRole,
} from "@/lib/organization-permissions"
import type { OrganizationPermission } from "@/lib/organization-permissions"
import type { LeagueContext, OrganizationRole } from "@/lib/types"

import type { Executor } from "../db/client"
import {
  findLeagueAccess,
  leagueContextFromAccess,
} from "../repositories/leagues"

export const OrganizationLeagueSchema = z.object({
  organizationId: z.uuid(),
  leagueId: z.string().min(1),
})

export async function requireLeagueAccess(
  executor: Executor,
  input: {
    organizationId: string
    leagueId: string
    userId: string
    permission?: OrganizationPermission
  }
): Promise<LeagueContext> {
  const access = await findLeagueAccess(
    executor,
    input.organizationId,
    input.leagueId,
    input.userId
  )
  if (!access || !isOrganizationRole(access.role)) {
    throw new DomainError("league.not_found")
  }

  const role: OrganizationRole = access.role
  if (input.permission && !hasOrganizationPermission(role, input.permission)) {
    throw new DomainError("league.forbidden")
  }

  return leagueContextFromAccess(
    access,
    role,
    hasOrganizationPermission(role, "league:manage")
  )
}

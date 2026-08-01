import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"

import { DomainError } from "@/lib/domain-errors"
import {
  PUBLIC_VIEW_PASSWORD_MAX_LENGTH,
  PUBLIC_VIEW_SESSION_SECONDS,
} from "@/lib/public-view"
import { organizationBrandColorFromMetadata } from "@/lib/organization-brand"
import type { PublicViewDashboard, PublicViewEntry } from "@/lib/types"

import { requirePublicViewLeagueAccess } from "./public-view-access.server"
import { TimeRangeSchema, statisticsRange } from "./statistics-range"
import { getDb } from "../db/client"
import { publicViewRequest } from "../middleware/public-view"
import { findSummary } from "../repositories/dashboard"
import { findOrganizationPublicViewBySlug } from "../repositories/organization-public-view"
import { findAllPlayers } from "../repositories/players"
import { findPool } from "../repositories/pool"
import {
  consumeRateLimit,
  hashRateLimitIdentity,
} from "../repositories/rate-limit"
import { findActiveRound, findHistory } from "../repositories/rounds"
import { findSettings } from "../repositories/settings"
import { findLeaguesForOrganization } from "../repositories/leagues"
import { verifyPublicViewPassword } from "../public-view-password.server"
import {
  createPublicViewSession,
  publicViewCookieName,
} from "../public-view-session.server"

const FIFTEEN_MINUTES = 15 * 60 * 1000
const SlugSchema = z.object({
  organizationSlug: z.string().trim().min(3).max(48),
})
const LeagueSchema = SlugSchema.extend({
  leagueId: z.string().min(1),
})
const HistorySchema = LeagueSchema.extend({ range: TimeRangeSchema })

export const fetchPublicViewEntry = createServerFn({ method: "GET" })
  .middleware([publicViewRequest])
  .validator(SlugSchema)
  .handler(async ({ data }): Promise<PublicViewEntry> => {
    const database = getDb()
    const record = await findOrganizationPublicViewBySlug(
      database,
      data.organizationSlug
    )
    if (!record?.enabled || !record.passwordHash) {
      throw new DomainError("public_view.unavailable")
    }
    const defaultLeague = (
      await findLeaguesForOrganization(database, record.organizationId)
    ).at(0)
    if (!defaultLeague) throw new DomainError("public_view.unavailable")
    return {
      organizationName: record.organizationName,
      organizationSlug: record.organizationSlug,
      organizationLogo: record.organizationLogo,
      brandColor: organizationBrandColorFromMetadata(
        record.organizationMetadata
      ),
      defaultLeagueId: defaultLeague.id,
    }
  })

export const authenticatePublicView = createServerFn({ method: "POST" })
  .validator(
    SlugSchema.extend({
      password: z.string().min(1).max(PUBLIC_VIEW_PASSWORD_MAX_LENGTH),
    })
  )
  .handler(async ({ data }) => {
    const { getRequestHeaders, setCookie } =
      await import("@tanstack/react-start/server")
    const headers = getRequestHeaders()
    const identity = [
      headers.get("cf-connecting-ip") ??
        headers.get("x-forwarded-for")?.split(",", 1)[0]?.trim() ??
        "unknown",
      headers.get("user-agent") ?? "unknown",
      data.organizationSlug,
    ].join(":")
    const allowed = await consumeRateLimit(
      `public-view:login:${hashRateLimitIdentity(identity)}`,
      new Date(),
      FIFTEEN_MINUTES,
      5
    )
    if (!allowed) throw new DomainError("public_view.rate_limited")

    const record = await findOrganizationPublicViewBySlug(
      getDb(),
      data.organizationSlug
    )
    const valid =
      record?.enabled &&
      record.passwordHash &&
      (await verifyPublicViewPassword(data.password, record.passwordHash))
    if (!record || !valid) {
      throw new DomainError("public_view.invalid_password")
    }
    const now = new Date()
    setCookie(
      publicViewCookieName(record.organizationId),
      createPublicViewSession(
        record.organizationId,
        record.credentialVersion,
        now
      ),
      {
        httpOnly: true,
        maxAge: PUBLIC_VIEW_SESSION_SECONDS,
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      }
    )
    return { organizationSlug: record.organizationSlug }
  })

export const endPublicViewSession = createServerFn({ method: "POST" })
  .validator(SlugSchema)
  .handler(async ({ data }) => {
    const record = await findOrganizationPublicViewBySlug(
      getDb(),
      data.organizationSlug
    )
    if (record) {
      const { setCookie } = await import("@tanstack/react-start/server")
      setCookie(publicViewCookieName(record.organizationId), "", {
        httpOnly: true,
        maxAge: 0,
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      })
    }
    return { organizationSlug: data.organizationSlug }
  })

export const fetchPublicViewContext = createServerFn({ method: "GET" })
  .middleware([publicViewRequest])
  .validator(LeagueSchema)
  .handler(({ context, data }) =>
    requirePublicViewLeagueAccess(data, context.publicViewCookies, new Date())
  )

export const fetchPublicViewDashboard = createServerFn({ method: "GET" })
  .middleware([publicViewRequest])
  .validator(LeagueSchema)
  .handler(async ({ context, data }): Promise<PublicViewDashboard> => {
    const access = await requirePublicViewLeagueAccess(
      data,
      context.publicViewCookies,
      new Date()
    )
    const database = getDb()
    const [summary, players, pool, settings] = await Promise.all([
      findSummary(database, access.leagueId),
      findAllPlayers(database, access.leagueId),
      findPool(database, access.leagueId),
      findSettings(database, access.leagueId),
    ])
    if (!settings) throw new DomainError("settings.not_found")
    return {
      summary,
      players: players.map(
        ({ firstName: _firstName, lastName: _lastName, ...player }) => player
      ),
      activePoolPlayerIds: pool.entries
        .filter((entry) => entry.status !== "absent")
        .map((entry) => entry.player.id),
      table: settings.table,
    }
  })

export const fetchPublicViewActiveRound = createServerFn({ method: "GET" })
  .middleware([publicViewRequest])
  .validator(LeagueSchema)
  .handler(async ({ context, data }) => {
    const access = await requirePublicViewLeagueAccess(
      data,
      context.publicViewCookies,
      new Date()
    )
    return findActiveRound(getDb(), access.leagueId)
  })

export const fetchPublicViewHistory = createServerFn({ method: "GET" })
  .middleware([publicViewRequest])
  .validator(HistorySchema)
  .handler(async ({ context, data }) => {
    const access = await requirePublicViewLeagueAccess(
      data,
      context.publicViewCookies,
      new Date()
    )
    return findHistory(getDb(), access.leagueId, statisticsRange(data.range))
  })

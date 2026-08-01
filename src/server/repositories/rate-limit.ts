import "@tanstack/react-start/server-only"

import { createHash } from "node:crypto"
import { sql } from "drizzle-orm"

import { rateLimit } from "../db/auth-schema"
import { getDb } from "../db/client"

export function hashRateLimitIdentity(identity: string): string {
  return createHash("sha256").update(identity, "utf8").digest("hex")
}

export async function consumeRateLimit(
  key: string,
  now: Date,
  windowMs: number,
  maximum: number
): Promise<boolean> {
  const nowMs = now.getTime()
  const windowStart = nowMs - windowMs
  const row = (
    await getDb()
      .insert(rateLimit)
      .values({ key, count: 1, lastRequest: nowMs })
      .onConflictDoUpdate({
        target: rateLimit.key,
        set: {
          count: sql`case
            when ${rateLimit.lastRequest} < ${windowStart} then 1
            else ${rateLimit.count} + 1
          end`,
          lastRequest: nowMs,
        },
      })
      .returning({ count: rateLimit.count })
  ).at(0)
  return Boolean(row && row.count <= maximum)
}

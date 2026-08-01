import "@tanstack/react-start/server-only"

import type { PoolConfig } from "pg"

/**
 * Serverless functions scale horizontally: every instance opens its own pool,
 * and both pools in this directory count separately. A large per-instance pool
 * therefore does not buy throughput — it exhausts the database's connection
 * limit. Keep each pool small and let idle connections go quickly.
 */
export const poolOptions: Pick<PoolConfig, "max" | "idleTimeoutMillis"> = {
  max: 3,
  idleTimeoutMillis: 10_000,
}

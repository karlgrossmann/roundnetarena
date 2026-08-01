import "@tanstack/react-start/server-only"

import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"

import { getAuthEnvironment } from "../config"
import * as authSchema from "./auth-schema"
import { poolOptions } from "./pool-options"

export type AuthDatabase = ReturnType<typeof createAuthDatabase>

let database: AuthDatabase | undefined
let pool: Pool | undefined

function createAuthDatabase() {
  pool = new Pool({
    connectionString: getAuthEnvironment().databaseUrl,
    ...poolOptions,
  })
  return drizzle(pool, { schema: authSchema })
}

export function getAuthDb(): AuthDatabase {
  database ??= createAuthDatabase()
  return database
}

export async function closeAuthDb(): Promise<void> {
  await pool?.end()
  pool = undefined
  database = undefined
}

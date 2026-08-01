import "@tanstack/react-start/server-only"

import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"

import { poolOptions } from "./pool-options"
import * as schema from "./schema"

export type Database = ReturnType<typeof createDatabase>
export type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0]
export type Executor = Database | Transaction

let database: Database | undefined
let pool: Pool | undefined

function connectionString(): string {
  const value = process.env.DATABASE_URL
  if (!value) throw new Error("DATABASE_URL is not set.")
  return value
}

function createDatabase() {
  pool = new Pool({ connectionString: connectionString(), ...poolOptions })
  return drizzle(pool, { schema })
}

/** The connection is created on first database access, not at bundle build time. */
export function getDb(): Database {
  database ??= createDatabase()
  return database
}

/** Only for integration tests and orderly shutdown. */
export async function closeDb(): Promise<void> {
  await pool?.end()
  pool = undefined
  database = undefined
}

import "dotenv/config"

import { defineConfig } from "drizzle-kit"

function databaseUrl(): string {
  const value = process.env.DATABASE_URL
  if (!value) throw new Error("DATABASE_URL is not set.")
  return value
}

export default defineConfig({
  dialect: "postgresql",
  schema: ["./src/server/db/schema.ts", "./src/server/db/auth-schema.ts"],
  out: "./drizzle",
  dbCredentials: { url: databaseUrl() },
  strict: true,
  verbose: true,
})

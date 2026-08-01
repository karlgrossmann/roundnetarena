import "@tanstack/react-start/server-only"

import { z } from "zod"

const postgresUrl = z
  .string()
  .min(1)
  .refine(
    (value) =>
      value.startsWith("postgres://") || value.startsWith("postgresql://"),
    "must be a PostgreSQL URL"
  )

const AuthEnvironmentSchema = z.object({
  DATABASE_URL: postgresUrl,
  AUTH_DATABASE_URL: postgresUrl.optional(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
  AUTH_TRUSTED_ORIGINS: z.string().optional(),
})

const EmailEnvironmentSchema = z.object({
  RESEND_API_KEY: z.string().min(1),
  MAIL_FROM: z.string().min(1),
})

const StorageEnvironmentSchema = z.object({
  SUPABASE_URL: z.url(),
  SUPABASE_SECRET_KEY: z.string().min(1),
})

export interface AuthEnvironment {
  databaseUrl: string
  secret: string
  baseUrl: string
  trustedOrigins: string[]
}

export interface EmailEnvironment {
  apiKey: string
  from: string
}

export interface StorageEnvironment {
  url: string
  secretKey: string
}

export function getAuthEnvironment(): AuthEnvironment {
  const environment = parseEnvironment(AuthEnvironmentSchema, "Auth")
  const baseOrigin = new URL(environment.BETTER_AUTH_URL).origin
  const additionalOrigins = (environment.AUTH_TRUSTED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
    .map((origin) => new URL(origin).origin)

  return {
    databaseUrl: environment.AUTH_DATABASE_URL ?? environment.DATABASE_URL,
    secret: environment.BETTER_AUTH_SECRET,
    baseUrl: environment.BETTER_AUTH_URL,
    trustedOrigins: Array.from(new Set([baseOrigin, ...additionalOrigins])),
  }
}

export function getEmailEnvironment(): EmailEnvironment {
  const environment = parseEnvironment(EmailEnvironmentSchema, "Email")
  return {
    apiKey: environment.RESEND_API_KEY,
    from: environment.MAIL_FROM,
  }
}

export function getStorageEnvironment(): StorageEnvironment {
  const environment = parseEnvironment(StorageEnvironmentSchema, "Storage")
  return {
    url: environment.SUPABASE_URL,
    secretKey: environment.SUPABASE_SECRET_KEY,
  }
}

function parseEnvironment<TSchema extends z.ZodType>(
  schema: TSchema,
  label: string
): z.output<TSchema> {
  const result = schema.safeParse(process.env)
  if (result.success) return result.data

  const variables = Array.from(
    new Set(result.error.issues.map((issue) => String(issue.path[0])))
  ).join(", ")
  throw new Error(`${label} configuration is invalid: ${variables}.`)
}

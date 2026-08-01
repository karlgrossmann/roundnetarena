// @vitest-environment node

import { afterEach, describe, expect, it, vi } from "vitest"

import {
  getAuthEnvironment,
  getEmailEnvironment,
  getStorageEnvironment,
} from "./config"

afterEach(() => {
  vi.unstubAllEnvs()
})

describe("server configuration", () => {
  it("normalizes and deduplicates trusted origins", () => {
    vi.stubEnv("AUTH_DATABASE_URL", undefined)
    vi.stubEnv(
      "DATABASE_URL",
      "postgresql://roundnet:roundnet@localhost:54329/roundnet"
    )
    vi.stubEnv(
      "BETTER_AUTH_SECRET",
      "test-secret-with-at-least-thirty-two-characters"
    )
    vi.stubEnv("BETTER_AUTH_URL", "https://app.example.com/auth")
    vi.stubEnv(
      "AUTH_TRUSTED_ORIGINS",
      "https://preview.example.com/path, https://app.example.com"
    )

    expect(getAuthEnvironment()).toEqual({
      databaseUrl: "postgresql://roundnet:roundnet@localhost:54329/roundnet",
      secret: "test-secret-with-at-least-thirty-two-characters",
      baseUrl: "https://app.example.com/auth",
      trustedOrigins: [
        "https://app.example.com",
        "https://preview.example.com",
      ],
    })
  })

  it("names invalid auth variables but never their values", () => {
    const shortSecret = "do-not-log-this"
    vi.stubEnv("DATABASE_URL", "not-a-postgres-url")
    vi.stubEnv("BETTER_AUTH_SECRET", shortSecret)
    vi.stubEnv("BETTER_AUTH_URL", "not-a-url")

    expect(() => getAuthEnvironment()).toThrow(
      "Auth configuration is invalid: DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL."
    )
    try {
      getAuthEnvironment()
    } catch (error) {
      expect(String(error)).not.toContain(shortSecret)
    }
  })

  it("validates the Resend configuration separately", () => {
    vi.stubEnv("RESEND_API_KEY", "")
    vi.stubEnv("MAIL_FROM", "")

    expect(() => getEmailEnvironment()).toThrow(
      "Email configuration is invalid: RESEND_API_KEY, MAIL_FROM."
    )
  })

  it("returns the storage configuration without writing secrets into errors", () => {
    const secretKey = "never-print-this-storage-secret"
    vi.stubEnv("SUPABASE_URL", "not-a-url")
    vi.stubEnv("SUPABASE_SECRET_KEY", secretKey)

    expect(() => getStorageEnvironment()).toThrow(
      "Storage configuration is invalid: SUPABASE_URL."
    )
    try {
      getStorageEnvironment()
    } catch (error) {
      expect(String(error)).not.toContain(secretKey)
    }
  })
})

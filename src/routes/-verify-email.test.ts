import { defaultParseSearch } from "@tanstack/react-router"
import { describe, expect, it } from "vitest"

import { verifyEmailSearchSchema } from "./verify-email"

describe("email verification search parameters", () => {
  it("accepts the successful Better Auth callback", () => {
    const search = defaultParseSearch("?verified=1&lang=de")

    expect(verifyEmailSearchSchema.parse(search)).toEqual({ verified: 1 })
  })
})

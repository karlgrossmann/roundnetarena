import { describe, expect, it } from "vitest"

import {
  fromPoolStatus,
  toMatchExplanation,
  toOrganizationSummary,
  toPoolStatus,
} from "./mappers"
import { DEFAULT_ORGANIZATION_BRAND_COLOR } from "@/lib/organization-brand"

describe("pool status mapping", () => {
  it.each([
    ["playing", "active"],
    ["paused", "paused"],
    ["absent", "absent"],
  ] as const)("maps %s to %s without loss", (domain, database) => {
    expect(fromPoolStatus(domain)).toBe(database)
    expect(toPoolStatus(database)).toBe(domain)
  })
})

describe("matcher explanation mapping", () => {
  const stored = {
    version: 1,
    matcher: "default",
    chosen: {
      id: "chosen",
      matchups: [{ teamA: ["p1", "p2"], teamB: ["p3", "p4"] }],
      cost: 100,
    },
    alternatives: [
      {
        id: "ratingRange",
        matchups: [{ teamA: ["p1", "p3"], teamB: ["p2", "p4"] }],
        cost: 125,
        costDelta: 25,
      },
    ],
  }

  it("returns a valid language-neutral JSON structure", () => {
    expect(toMatchExplanation(stored)).toEqual(stored)
  })

  it("does not let corrupted or unknown versions reach the UI", () => {
    expect(toMatchExplanation({ ...stored, version: 2 })).toBeUndefined()
    expect(
      toMatchExplanation({
        ...stored,
        alternatives: [{ ...stored.alternatives[0], costDelta: -1 }],
      })
    ).toBeUndefined()
  })
})

describe("organization mapping", () => {
  it("reads the brand color and falls back to the default for legacy records", () => {
    const base = {
      id: "organization",
      name: "Roundnet Bielefeld",
      slug: "roundnet-bielefeld",
      logo: null,
      role: "owner",
      activeOrganizationId: "organization",
      leagueId: "league",
    }

    expect(
      toOrganizationSummary({
        ...base,
        metadata: '{"brandColor":"indigo"}',
      }).brandColor
    ).toBe("indigo")
    expect(toOrganizationSummary(base).brandColor).toBe(
      DEFAULT_ORGANIZATION_BRAND_COLOR
    )
  })
})

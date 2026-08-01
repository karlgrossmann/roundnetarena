/**
 * Predictable IDs in the database format (`createId()` in `src/server/db/ids.ts`), but
 * without randomness: the same index always yields the same ID. Random IDs would change
 * snapshot comparisons and Storybook URLs on every run.
 */

type FixturePrefix = "player" | "block" | "game" | "fixed_team" | "league"

/** 16 hex characters like `randomBytes(8).toString("hex")`, padded from the index. */
export function fixtureId(prefix: FixturePrefix, index: number): string {
  return `${prefix}_${index.toString(16).padStart(16, "0")}`
}

import { useEffect, useState } from "react"

/**
 * The current time, available only after hydration.
 *
 * Server and client render at different moments and in different zones, so a `new Date()`
 * during render causes a hydration mismatch (see `docs/tanstack-patterns.md`). Before
 * hydration the value is `null`, so time-dependent output appears a moment later instead.
 */
export function useNow(): Date | null {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
  }, [])

  return now
}

import { Suspense, useMemo } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { Decorator } from "@storybook/react-vite"
import { LeagueContextProvider } from "@/components/league/LeagueContext"
import { fixtureLeagueContext } from "@/lib/fixtures"

/**
 * A pair of query key and ready-made data. The keys come from `queryKeys`
 * (`src/lib/api/queries.ts`) — stories never assemble them themselves, no more than
 * components do.
 */
export type QuerySeed = Array<[queryKey: ReadonlyArray<unknown>, data: unknown]>

/**
 * Gives every story its own QueryClient, prefilled from `parameters.query`.
 *
 * `useSuspenseQuery` components are served immediately and no server function is ever
 * called. If an entry is missing, the query falls through to the stub and the story fails
 * with a clear message — intentionally, since a story that silently loads would only show
 * a spinner.
 *
 * Example:
 *
 * ```tsx
 * parameters: {
 *   query: [
 *     [queryKeys.players, makePlayers(12)],
 *     [queryKeys.pool, makePool()],
 *   ] satisfies QuerySeed,
 * }
 * ```
 */
export const withQueryClient: Decorator = (Story, context) => {
  const seed = context.parameters.query as QuerySeed | undefined

  const queryClient = useMemo(() => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          // Nothing to refetch or retry in Storybook: a failed call is always a defect in
          // the story, never a network problem.
          retry: false,
          staleTime: Number.POSITIVE_INFINITY,
        },
      },
    })

    for (const [queryKey, data] of seed ?? []) {
      client.setQueryData(queryKey, data)
    }

    return client
  }, [seed])

  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={null}>
        <LeagueContextProvider value={fixtureLeagueContext}>
          <Story />
        </LeagueContextProvider>
      </Suspense>
    </QueryClientProvider>
  )
}

import { QueryClient } from "@tanstack/react-query"
import { createRouter as createTanStackRouter } from "@tanstack/react-router"
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query"

import { AppErrorFallback } from "./components/AppErrorFallback"
import { NotFoundPage } from "./components/NotFoundPage"
import { routeTree } from "./routeTree.gen"

export function getRouter() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // The data only changes through the user's own actions — no concurrency that
        // would justify frequent refetching.
        staleTime: 60_000,
        retry: 1,
      },
    },
  })

  const router = createTanStackRouter({
    routeTree,
    context: { queryClient },

    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,

    // Error boundary for every route without its own, including the root route.
    // Otherwise a thrown error shows the TanStack default block, and an error higher up
    // the tree an empty page.
    defaultErrorComponent: AppErrorFallback,
    defaultNotFoundComponent: NotFoundPage,

    // The 1000 ms default is too high here: at normal speed you would never see a
    // skeleton, only a briefly frozen UI.
    defaultPendingMs: 150,
    // Once the skeleton is up it stays this long, which prevents flashing when the data
    // arrives right after it appeared.
    defaultPendingMinMs: 400,
  })

  setupRouterSsrQueryIntegration({ router, queryClient })

  return router
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}

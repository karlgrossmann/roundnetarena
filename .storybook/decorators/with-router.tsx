import { useMemo } from "react"
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router"
import type { Decorator } from "@storybook/react-vite"

import type { PageTitleKey } from "@/lib/i18n"
import type { getRouter } from "@/router"

type AppRouter = ReturnType<typeof getRouter>

export interface RouteParameters {
  /** What the header shows as the page title — only relevant for `AppShell`. */
  titleKey?: PageTitleKey
}

/**
 * An in-memory router so `Link`, `useNavigate` and `useMatches` work.
 *
 * The real route tree from `routeTree.gen.ts` is out of the question: it would render the
 * application's pages instead of the story.
 *
 * Instead of rebuilding every link target, a splat route catches everything. No story
 * breaks when a new route is added, and clicking a link visibly leads out of the story
 * rather than silently nowhere.
 */
export const withRouter: Decorator = (Story, context) => {
  const titleKey =
    (context.parameters.route as RouteParameters | undefined)?.titleKey ??
    "dashboard"

  const router = useMemo(() => {
    const rootRoute = createRootRoute({ component: Outlet })

    const storyRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: "/",
      component: () => <Story />,
      staticData: { titleKey },
    })

    const elsewhereRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: "$",
      component: NavigatedAway,
    })

    return createRouter({
      routeTree: rootRoute.addChildren([storyRoute, elsewhereRoute]),
      history: createMemoryHistory({ initialEntries: ["/"] }),
    })
  }, [Story, titleKey])

  // The stub tree cannot satisfy the application's registered router type — it does not
  // know its paths. Irrelevant at runtime.
  return <RouterProvider router={router as unknown as AppRouter} />
}

function NavigatedAway() {
  return (
    <p className="p-4 text-sm text-muted-foreground">
      This link leads out of the story. In the application the target page would
      be here.
    </p>
  )
}

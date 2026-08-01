import { render, screen } from "@testing-library/react"
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  notFound,
} from "@tanstack/react-router"
import { describe, expect, it } from "vitest"

import { AppErrorFallback } from "./AppErrorFallback"
import { NotFoundPage } from "./NotFoundPage"

type Loader = () => unknown

/**
 * An in-memory router with the same defaults as `src/router.tsx`. The real route tree
 * is not an option — it would load the application's pages.
 */
function renderWithFallbacks(loader: Loader) {
  const rootRoute = createRootRoute({ component: Outlet })
  const pageRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    loader,
    component: () => <p>Content</p>,
  })

  const router = createRouter({
    routeTree: rootRoute.addChildren([pageRoute]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
    defaultErrorComponent: AppErrorFallback,
    defaultNotFoundComponent: NotFoundPage,
  })

  // The stub tree cannot satisfy the application's registered route type.
  return render(
    <RouterProvider
      router={
        router as unknown as Parameters<typeof RouterProvider>[0]["router"]
      }
    />
  )
}

describe("router error boundaries", () => {
  it("shows the generic error state when a route without its own boundary throws", async () => {
    renderWithFallbacks(() => {
      throw new Error("Loader failed")
    })

    expect(await screen.findByText("Da ist etwas schiefgelaufen")).toBeDefined()
    expect(
      screen.getByText("Dieser Bereich konnte nicht geladen werden.")
    ).toBeDefined()
    expect(
      screen.getByRole("button", { name: "Erneut versuchen" })
    ).toBeDefined()
    expect(screen.getByRole("link", { name: "Zur Startseite" })).toBeDefined()
    expect(screen.queryByText("Content")).toBeNull()
  })

  it("shows the not-found page without a retry button", async () => {
    renderWithFallbacks(() => {
      throw notFound()
    })

    expect(await screen.findByText("Seite nicht gefunden")).toBeDefined()
    expect(screen.getByRole("link", { name: "Zur Startseite" })).toBeDefined()
    expect(
      screen.queryByRole("button", { name: "Erneut versuchen" })
    ).toBeNull()
  })
})

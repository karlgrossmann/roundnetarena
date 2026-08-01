import { render, screen } from "@testing-library/react"
import { useSuspenseQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { describe, expect, it } from "vitest"
import type { Decorator, StoryContext } from "@storybook/react-vite"

import { withLocale } from "./with-locale"
import { withQueryClient } from "./with-query-client"
import { withRouter } from "./with-router"
import { withTheme } from "./with-theme"
import { round_create } from "@/paraglide/messages.js"

/**
 * The decorators carry the whole Storybook setup: without them no story with router,
 * query or translated text renders. A defect would otherwise only surface in the browser.
 *
 * The stories themselves are not executed here — that would be the Vitest addon, which is
 * deliberately not part of this setup.
 */

/** Minimal story context; the decorators only read `globals` and `parameters`. */
function contextWith(
  globals: Record<string, unknown> = {},
  parameters: Record<string, unknown> = {}
): StoryContext {
  return {
    globals: { locale: "de", theme: "light", ...globals },
    parameters,
  } as unknown as StoryContext
}

/**
 * The decorator is called inside a component, not before it: Storybook renders it the
 * same way, and only then do its hooks belong to a single render pass.
 */
function renderWith(
  decorator: Decorator,
  Story: () => React.ReactElement,
  context: StoryContext
) {
  const Decorated = () => <>{decorator(Story, context)}</>
  return render(<Decorated />)
}

describe("withTheme", () => {
  it("sets the document class that Tailwind reacts to", () => {
    renderWith(withTheme, () => <p>Content</p>, contextWith({ theme: "dark" }))

    expect(document.documentElement.classList.contains("dark")).toBe(true)
    expect(document.documentElement.style.colorScheme).toBe("dark")
  })
})

describe("withLocale", () => {
  it("translates the messages into the selected language", () => {
    renderWith(withLocale, () => <p>{round_create()}</p>, contextWith())
    expect(screen.getByText("Runde generieren")).toBeTruthy()

    renderWith(
      withLocale,
      () => <p>{round_create()}</p>,
      contextWith({ locale: "en" })
    )
    expect(screen.getByText("Create round")).toBeTruthy()
  })
})

describe("withQueryClient", () => {
  const queryKey = ["fixture", "players"] as const

  function PlayerCount() {
    // Without a prefilled cache this query would have to load and the story stay empty.
    const { data } = useSuspenseQuery({
      queryKey,
      queryFn: () => {
        throw new Error("No call must happen.")
      },
    })
    return <p>{String(data)}</p>
  }

  it("serves useSuspenseQuery from parameters.query without running the query", () => {
    renderWith(
      withQueryClient,
      () => <PlayerCount />,
      contextWith({}, { query: [[queryKey, 12]] })
    )

    expect(screen.getByText("12")).toBeTruthy()
  })
})

describe("withRouter", () => {
  it("renders the story and makes Link usable", async () => {
    renderWith(
      withRouter,
      () => (
        <div>
          <span>Story content</span>
          <Link to="/login">To sign-in</Link>
        </div>
      ),
      contextWith()
    )

    expect(await screen.findByText("Story content")).toBeTruthy()

    const link = await screen.findByRole("link", { name: "To sign-in" })
    expect(link.getAttribute("href")).toBe("/login")
  })
})

import type { ReactNode } from "react"
import type { LinkProps } from "@tanstack/react-router"

import { AppBar } from "./AppBar"
import { TabBar } from "./TabBar"
import type { NavItem, NavParams } from "./navigation"

interface ShellProps {
  brand?: ReactNode
  title?: string
  backTo?: LinkProps["to"]
  badge?: ReactNode
  nav?: { items: ReadonlyArray<NavItem>; params: NavParams }
  actions: ReactNode
  /**
   * `app` is the normal page layout. `centered` puts a single card in the middle — for
   * login and the access prompt, which have no navigation yet.
   */
  variant?: "app" | "centered"
  children: ReactNode
}

/**
 * The frame of every page: header bar, content and — as long as there is navigation —
 * the tab bar.
 *
 * Sits in `__root.tsx` (or the public view's shell) around the `<Outlet />`, not in the
 * individual pages. Otherwise the navigation would remount on every transition and every
 * `pendingComponent` would have to render it itself.
 */
export function Shell({
  brand,
  title,
  backTo,
  badge,
  nav,
  actions,
  variant = "app",
  children,
}: ShellProps) {
  return (
    <div className="min-h-svh bg-background">
      <AppBar
        brand={brand}
        title={title}
        backTo={backTo}
        badge={badge}
        nav={nav}
        actions={actions}
      />

      {variant === "centered" ? (
        <main className="flex min-h-[calc(100svh-var(--app-bar-height))] items-center justify-center bg-muted/30 px-4 py-12">
          {children}
        </main>
      ) : (
        // Enough room at the bottom that the tab bar covers nothing — safe area included.
        <main className="mx-auto w-full max-w-5xl px-4 py-4 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-10">
          {children}
        </main>
      )}

      {nav ? <TabBar items={nav.items} params={nav.params} /> : null}
    </div>
  )
}

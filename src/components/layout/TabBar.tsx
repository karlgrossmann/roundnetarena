import { Link } from "@tanstack/react-router"

import type { NavItem, NavParams } from "./navigation"
import { pageTitle } from "@/lib/i18n"
import { nav_main } from "@/paraglide/messages.js"

/**
 * Main navigation below `md`, along the bottom edge for the thumb.
 *
 * The same targets as in the header bar, from the same list — otherwise phone and desktop
 * would drift apart as soon as a target is added.
 */
export function TabBar({
  items,
  params,
}: {
  items: ReadonlyArray<NavItem>
  params: NavParams
}) {
  return (
    <nav
      aria-label={nav_main()}
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-background/75 md:hidden"
    >
      <ul className="flex h-(--tab-bar-height) items-stretch">
        {items.map((item) => (
          <li key={item.labelKey} className="flex-1">
            <Link
              {...item.link(params)}
              activeProps={{
                "aria-current": "page",
                className: "text-primary",
              }}
              className="flex h-full flex-col items-center justify-center gap-0.5 px-1 text-muted-foreground transition-colors"
            >
              <item.icon className="size-5" />
              <span className="text-[0.6875rem] leading-none font-medium">
                {pageTitle(item.labelKey)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

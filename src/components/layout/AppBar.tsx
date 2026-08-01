import type { ReactNode } from "react"
import { IconChevronLeft } from "@/components/icons"
import { Link } from "@tanstack/react-router"
import type { LinkProps } from "@tanstack/react-router"

import type { NavItem, NavParams } from "./navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { pageTitle } from "@/lib/i18n"
import { nav_back, nav_main } from "@/paraglide/messages.js"

interface AppBarProps {
  /** Brand, left — the organization crest in the signed-in area. Without a brand the
   *  left zone stays empty: on login and the access prompt the card carries the brand. */
  brand?: ReactNode
  /** Where the page is. Always visible below `md`; from `md` up only without navigation,
   *  because the active pill already says where you are. */
  title?: string
  /** Replaces the brand with a back arrow — for pages one step below their origin. */
  backTo?: LinkProps["to"]
  /** Marker on the bar, visible at every width — such as the read-only hint. Unlike the
   *  brand it does not disappear below `md`. */
  badge?: ReactNode
  nav?: { items: ReadonlyArray<NavItem>; params: NavParams }
  /** Right-hand group. One menu, not a row of single buttons — see `AppBarMenu`. */
  actions: ReactNode
}

/**
 * The application's header bar — the same one in the signed-in area, the public view and
 * the anonymous pages.
 *
 * Three zones with fixed places: the outer ones carry `flex-1`, the navigation in the
 * middle does not. That keeps it optically centered and steady no matter how long the
 * title or how wide the action group is. Two competing `ml-auto` — the previous setup —
 * split the free space between them instead and let the navigation shift with every
 * content width.
 */
export function AppBar({
  brand,
  title,
  backTo,
  badge,
  nav,
  actions,
}: AppBarProps) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex h-(--app-bar-height) w-full max-w-5xl items-center gap-2 px-4">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {backTo ? (
            <Button
              variant="ghost"
              size="icon"
              className="-ml-2 size-11 shrink-0 md:size-9"
              aria-label={nav_back()}
              render={<Link to={backTo} />}
            >
              <IconChevronLeft />
            </Button>
          ) : brand ? (
            <span className={cn("flex shrink-0", nav && "hidden md:flex")}>
              {brand}
            </span>
          ) : null}

          {title ? (
            <h1
              className={cn(
                "min-w-0 flex-1 truncate font-heading text-base font-medium",
                nav && "md:hidden"
              )}
            >
              {title}
            </h1>
          ) : null}

          {badge}
        </div>

        {nav ? (
          <nav
            aria-label={nav_main()}
            className="hidden shrink-0 items-center gap-1 md:flex"
          >
            {nav.items.map((item) => (
              <Link
                key={item.labelKey}
                {...item.link(nav.params)}
                activeProps={{
                  "aria-current": "page",
                  className: "bg-muted text-foreground",
                }}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
              >
                {pageTitle(item.labelKey)}
              </Link>
            ))}
          </nav>
        ) : null}

        <div className="flex flex-1 shrink-0 items-center justify-end gap-0.5">
          {actions}
        </div>
      </div>
    </header>
  )
}

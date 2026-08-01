import {
  IconBallVolleyball,
  IconHistory,
  IconLayoutDashboard,
} from "@/components/icons"
import type { LinkProps } from "@tanstack/react-router"
import type { ComponentType } from "react"

import type { PageTitleKey } from "@/lib/i18n"

export interface NavParams {
  organizationSlug: string
  leagueId: string
}

export interface NavItem {
  labelKey: PageTitleKey
  icon: ComponentType<{ className?: string }>
  /**
   * Target including params. A function rather than a path string, because the router can
   * only check `to` and `params` together: a list with `to: string` loses exactly the
   * check the typed routes exist for.
   *
   * `exact` is part of it and applies only to the dashboard — without it the dashboard
   * would be active everywhere, because every path starts with its path.
   */
  link: (params: NavParams) => LinkProps
}

/**
 * The main navigation targets — the same in the tab bar as in the header bar, in this
 * order.
 *
 * Settings deliberately do not live here but in the account menu: they are opened rarely
 * and would have taken one of the tab bar's thumb slots, which are needed constantly
 * during a session day.
 */
export const APP_NAV_ITEMS: ReadonlyArray<NavItem> = [
  {
    labelKey: "dashboard",
    icon: IconLayoutDashboard,
    link: (params) => ({
      to: "/o/$organizationSlug/l/$leagueId",
      params,
      activeOptions: { exact: true },
    }),
  },
  {
    labelKey: "round",
    icon: IconBallVolleyball,
    link: (params) => ({
      to: "/o/$organizationSlug/l/$leagueId/round",
      params,
    }),
  },
  {
    labelKey: "history",
    icon: IconHistory,
    link: (params) => ({
      to: "/o/$organizationSlug/l/$leagueId/history",
      params,
    }),
  },
]

/** The same targets in the public view — without settings, because nothing can be
 *  changed there. */
export const PUBLIC_NAV_ITEMS: ReadonlyArray<NavItem> = [
  {
    labelKey: "dashboard",
    icon: IconLayoutDashboard,
    link: (params) => ({
      to: "/view/$organizationSlug/l/$leagueId",
      params,
      activeOptions: { exact: true },
    }),
  },
  {
    labelKey: "round",
    icon: IconBallVolleyball,
    link: (params) => ({
      to: "/view/$organizationSlug/l/$leagueId/round",
      params,
    }),
  },
  {
    labelKey: "history",
    icon: IconHistory,
    link: (params) => ({
      to: "/view/$organizationSlug/l/$leagueId/history",
      params,
    }),
  },
]

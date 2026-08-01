import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useRouterState,
} from "@tanstack/react-router"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"
import { TanStackDevtools } from "@tanstack/react-devtools"
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools"
import type { LinkProps } from "@tanstack/react-router"
import type { QueryClient } from "@tanstack/react-query"
import { Agentation } from "agentation"

import { AppShell } from "@/components/layout/AppShell"
import { LocalizedToaster } from "@/components/LocalizedToaster"
import { OrganizationBrandProvider } from "@/components/organization/OrganizationBrandProvider"
import { ThemeProvider } from "@/components/theme/ThemeProvider"
import { APP_NAME } from "@/lib/brand"
import { isPublicAuthPath } from "@/lib/auth-routes"
import { isPublicViewPath } from "@/lib/public-view"
import type { PageTitleKey } from "@/lib/i18n"
import { documentLocaleAttributes } from "@/lib/locale"
import { app_meta_description } from "@/paraglide/messages.js"
import appCss from "../styles.css?url"

export interface RouterContext {
  queryClient: QueryClient
}

/**
 * The app shell does not know the page title — every route supplies it via `staticData`.
 */
declare module "@tanstack/react-router" {
  interface StaticDataRouteOption {
    titleKey?: PageTitleKey
    /** Shows a back arrow to this target instead of the title. */
    backTo?: LinkProps["to"]
  }
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: APP_NAME,
      },
      {
        name: "description",
        content: app_meta_description(),
      },
      {
        name: "color-scheme",
        content: "light dark",
      },
      // Two separate values instead of one compromise: the browser bar should match
      // `--background` from `src/styles.css` in either scheme.
      {
        name: "theme-color",
        media: "(prefers-color-scheme: light)",
        content: "#ffffff",
      },
      {
        name: "theme-color",
        media: "(prefers-color-scheme: dark)",
        content: "#09090b",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      // Ordered by preference: browsers with SVG support take the vector version, the
      // rest fall back to PNG and finally to `.ico`.
      {
        rel: "icon",
        type: "image/svg+xml",
        href: "/favicon.svg",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "96x96",
        href: "/favicon-96x96.png",
      },
      {
        rel: "shortcut icon",
        href: "/favicon.ico",
      },
      {
        rel: "apple-touch-icon",
        sizes: "180x180",
        href: "/apple-touch-icon.png",
      },
      {
        rel: "manifest",
        href: "/site.webmanifest",
      },
    ],
  }),
  // `errorComponent` and `notFoundComponent` are router-wide defaults in
  // `src/router.tsx` and therefore apply here too.
  component: RootComponent,
  shellComponent: RootDocument,
})

/**
 * The shell lives here rather than in the individual pages: navigation stays put across
 * page changes, and a route's `pendingComponent` only affects the content area. The
 * toaster wraps everything so any page can report background failures via `toast.add()`.
 */
function RootComponent() {
  const isShelllessPage = useRouterState({
    select: (state) =>
      isPublicAuthPath(state.location.pathname) ||
      isPublicViewPath(state.location.pathname),
  })

  return (
    <OrganizationBrandProvider>
      {isShelllessPage ? (
        <Outlet />
      ) : (
        <LocalizedToaster>
          <AppShell>
            <Outlet />
          </AppShell>
        </LocalizedToaster>
      )}
    </OrganizationBrandProvider>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  const locale = documentLocaleAttributes()

  return (
    <html lang={locale.lang} dir={locale.dir} suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <ThemeProvider>
          {children}
          {process.env.NODE_ENV === "development" && (
            <TanStackDevtools
              config={{
                position: "bottom-left",
              }}
              plugins={[
                {
                  name: "Tanstack Router",
                  render: <TanStackRouterDevtoolsPanel />,
                },
                {
                  name: "Tanstack Query",
                  render: <ReactQueryDevtoolsPanel />,
                },
              ]}
            />
          )}
          {process.env.NODE_ENV === "development" && <Agentation />}
          <Scripts />
        </ThemeProvider>
      </body>
    </html>
  )
}

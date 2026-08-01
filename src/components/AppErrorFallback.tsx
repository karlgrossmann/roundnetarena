import { Link } from "@tanstack/react-router"
import type { ErrorComponentProps } from "@tanstack/react-router"

import { RouteError } from "@/components/RouteError"
import { Button } from "@/components/ui/button"
import { common_home } from "@/paraglide/messages.js"

/**
 * Last error boundary of the application — registered in `src/router.tsx` as
 * `defaultErrorComponent` for every route without its own `errorComponent`.
 *
 * Because it also covers the root route, where no app shell is rendered, it brings its
 * own spacing and a way back that needs no data from the broken page.
 */
export function AppErrorFallback({ error, reset }: ErrorComponentProps) {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-12">
      <RouteError
        error={error}
        reset={reset}
        action={
          <Button variant="outline" render={<Link to="/" />}>
            {common_home()}
          </Button>
        }
      />
    </div>
  )
}

import { Link } from "@tanstack/react-router"

import { IconSearch } from "@/components/icons"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  common_home,
  not_found_description,
  not_found_title,
} from "@/paraglide/messages.js"

/**
 * Unknown path — registered in `src/router.tsx` as `defaultNotFoundComponent`.
 *
 * A dead link is not a crash, so it offers a way back instead of a retry. As the router
 * default, every route renders its own 404 inside the app shell rather than bubbling it
 * up to the root.
 */
export function NotFoundPage() {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-12">
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <IconSearch />
          </EmptyMedia>
          <EmptyTitle>{not_found_title()}</EmptyTitle>
          <EmptyDescription>{not_found_description()}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button render={<Link to="/" />}>{common_home()}</Button>
        </EmptyContent>
      </Empty>
    </div>
  )
}

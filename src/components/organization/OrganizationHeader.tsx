import { OrganizationLogo } from "./OrganizationLogo"

interface OrganizationHeaderProps {
  name: string
  logo: string | null
  /**
   * Second line below the club name: the greeting in the signed-in area, the league in
   * the public view. Omitted, the header stays on a single line.
   */
  subline?: string
}

/**
 * Club crest and name above the page content.
 *
 * The club carries the heading and the subline steps back — in a multi-club app "where
 * am I?" is the more important answer. On the phone the header bar hides the crest in
 * favour of the page title, so this is the only place the club shows up there.
 */
export function OrganizationHeader({
  name,
  logo,
  subline,
}: OrganizationHeaderProps) {
  return (
    <div className="flex items-center gap-3">
      <OrganizationLogo
        name={name}
        logo={logo}
        className="size-11 md:size-12"
      />
      <div className="min-w-0">
        <h2 className="truncate font-heading text-xl font-semibold">{name}</h2>
        {subline ? (
          <p className="truncate text-sm text-muted-foreground">{subline}</p>
        ) : null}
      </div>
    </div>
  )
}

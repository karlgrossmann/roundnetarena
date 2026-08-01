import { cn } from "@/lib/utils"
import { organization_logo_alt } from "@/paraglide/messages.js"

export function OrganizationLogo({
  name,
  logo,
  className,
}: {
  name: string
  logo: string | null
  className?: string
}) {
  const fallback = "/logo.png"
  return (
    <img
      src={logo ?? fallback}
      alt={organization_logo_alt({ name })}
      width={512}
      height={512}
      className={cn("shrink-0 object-contain", className)}
      onError={(event) => {
        if (!event.currentTarget.src.endsWith(fallback)) {
          event.currentTarget.src = fallback
        }
      }}
    />
  )
}

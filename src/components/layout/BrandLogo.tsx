import { RoundnetArenaMark } from "./RoundnetArenaMark"
import { cn } from "@/lib/utils"

/**
 * Application logo in the variant matching the color scheme.
 *
 * `mark` is the emblem without the wordmark — the only variant still legible at 36 px in
 * the header bar. It is a vector and recolors itself through `currentColor`.
 *
 * `full` carries the wordmark and belongs on surfaces that can show it. Only raster
 * versions of it exist, hence two images instead of one source: the switch runs through
 * the `dark` variant rather than `prefers-color-scheme`, because the color scheme hangs
 * off the class on the document and thus also follows the manual choice a media query
 * would ignore. Both sit in the markup and are shown/hidden via CSS — so the server
 * render already shows the right one and nothing flips during hydration.
 */
const FULL_LOGO = {
  light: "/roundnet-arena-full.png",
  dark: "/roundnet-arena-white.png",
  size: 1024,
} as const

export type BrandLogoVariant = "mark" | "full"

export function BrandLogo({
  variant = "mark",
  className,
}: {
  variant?: BrandLogoVariant
  className?: string
}) {
  if (variant === "mark") {
    return <RoundnetArenaMark className={cn("text-foreground", className)} />
  }

  // The logo always sits next to the app name or the page title; alt text would only
  // read it out a second time.
  const shared = cn("shrink-0 object-contain", className)

  return (
    <>
      <img
        src={FULL_LOGO.light}
        alt=""
        width={FULL_LOGO.size}
        height={FULL_LOGO.size}
        className={cn(shared, "dark:hidden")}
      />
      <img
        src={FULL_LOGO.dark}
        alt=""
        width={FULL_LOGO.size}
        height={FULL_LOGO.size}
        className={cn(shared, "hidden dark:block")}
      />
    </>
  )
}

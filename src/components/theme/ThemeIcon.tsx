import { IconDeviceDesktop, IconMoon, IconSun } from "@/components/icons"

import type { Theme } from "./theme"

export function ThemeIcon({
  theme,
  className,
}: {
  theme: Theme
  className?: string
}) {
  switch (theme) {
    case "system":
      return <IconDeviceDesktop className={className} />
    case "light":
      return <IconSun className={className} />
    case "dark":
      return <IconMoon className={className} />
  }
}

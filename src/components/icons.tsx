/**
 * Central icon layer.
 *
 * HugeIcons ships data objects plus the `HugeiconsIcon` wrapper rather than ready-made
 * components. Both are assembled into named components here so domain code can write
 * `<IconPlus className="size-4" />` and the library stays swappable in one place.
 *
 * New icons are added here — never import from `@hugeicons/*` directly.
 */
import {
  Alert02Icon,
  AlertDiamondIcon,
  ArrowDown01Icon,
  ArrowDown02Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowUp01Icon,
  ArrowUp02Icon,
  Building06Icon,
  Calendar03Icon,
  CancelCircleIcon,
  Cancel01Icon,
  ChampionIcon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  ComputerIcon,
  Copy01Icon,
  DashboardSquare01Icon,
  Delete02Icon,
  HistoryIcon,
  Image02Icon,
  InformationCircleIcon,
  LayoutTable01Icon,
  Link02Icon,
  Loading03Icon,
  Logout03Icon,
  MedalFirstPlaceIcon,
  MedalSecondPlaceIcon,
  MedalThirdPlaceIcon,
  MinusSignIcon,
  Moon02Icon,
  MoreHorizontalIcon,
  PauseIcon,
  PlusSignIcon,
  Search01Icon,
  Settings02Icon,
  SidebarLeft01Icon,
  SquareUnlock01Icon,
  Sun03Icon,
  Tick02Icon,
  UnavailableIcon,
  UnfoldMoreIcon,
  Unlink02Icon,
  UserAdd01Icon,
  UserCircleIcon,
  UserMultipleIcon,
  UserQuestion01Icon,
  ViewIcon,
  VolleyballIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import type { IconSvgElement } from "@hugeicons/react"
import type { ComponentProps, ReactElement } from "react"

/**
 * Everything except the icon choice itself — the adapter sets `icon` and `altIcon`.
 *
 * `strokeWidth` is deliberately widened back to the SVG signature: components in `ui/`
 * pass `ComponentProps<"svg">` through, where a string value is also allowed.
 */
export type IconProps = Omit<
  ComponentProps<typeof HugeiconsIcon>,
  "icon" | "altIcon" | "showAlt" | "strokeWidth"
> & {
  strokeWidth?: number | string
}

export type IconComponent = (props: IconProps) => ReactElement

function createIcon(glyph: IconSvgElement, displayName: string): IconComponent {
  function Icon({ strokeWidth, ...props }: IconProps) {
    return (
      <HugeiconsIcon
        icon={glyph}
        strokeWidth={
          strokeWidth === undefined ? undefined : Number(strokeWidth)
        }
        {...props}
      />
    )
  }
  Icon.displayName = displayName
  return Icon
}

// Navigation and structure
export const IconLayoutDashboard = createIcon(
  DashboardSquare01Icon,
  "IconLayoutDashboard"
)
export const IconLayoutSidebar = createIcon(
  SidebarLeft01Icon,
  "IconLayoutSidebar"
)
export const IconBallVolleyball = createIcon(
  VolleyballIcon,
  "IconBallVolleyball"
)
export const IconHistory = createIcon(HistoryIcon, "IconHistory")
export const IconTrophy = createIcon(ChampionIcon, "IconTrophy")
export const IconMedalFirstPlace = createIcon(
  MedalFirstPlaceIcon,
  "IconMedalFirstPlace"
)
export const IconMedalSecondPlace = createIcon(
  MedalSecondPlaceIcon,
  "IconMedalSecondPlace"
)
export const IconMedalThirdPlace = createIcon(
  MedalThirdPlaceIcon,
  "IconMedalThirdPlace"
)
export const IconCalendar = createIcon(Calendar03Icon, "IconCalendar")
export const IconColumns = createIcon(LayoutTable01Icon, "IconColumns")

// Directions
export const IconChevronUp = createIcon(ArrowUp01Icon, "IconChevronUp")
export const IconChevronDown = createIcon(ArrowDown01Icon, "IconChevronDown")
export const IconChevronLeft = createIcon(ArrowLeft01Icon, "IconChevronLeft")
export const IconChevronRight = createIcon(ArrowRight01Icon, "IconChevronRight")
export const IconArrowUp = createIcon(ArrowUp02Icon, "IconArrowUp")
export const IconArrowDown = createIcon(ArrowDown02Icon, "IconArrowDown")
export const IconSelector = createIcon(UnfoldMoreIcon, "IconSelector")

// Actions
export const IconPlus = createIcon(PlusSignIcon, "IconPlus")
export const IconMinus = createIcon(MinusSignIcon, "IconMinus")
export const IconCheck = createIcon(Tick02Icon, "IconCheck")
export const IconX = createIcon(Cancel01Icon, "IconX")
export const IconTrash = createIcon(Delete02Icon, "IconTrash")
export const IconCopy = createIcon(Copy01Icon, "IconCopy")
export const IconSearch = createIcon(Search01Icon, "IconSearch")
export const IconSettings = createIcon(Settings02Icon, "IconSettings")
export const IconLogout = createIcon(Logout03Icon, "IconLogout")
export const IconDots = createIcon(MoreHorizontalIcon, "IconDots")
export const IconLink = createIcon(Link02Icon, "IconLink")
export const IconUnlink = createIcon(Unlink02Icon, "IconUnlink")
export const IconEye = createIcon(ViewIcon, "IconEye")
export const IconPhoto = createIcon(Image02Icon, "IconPhoto")

// Status and feedback
export const IconAlertTriangle = createIcon(Alert02Icon, "IconAlertTriangle")
export const IconAlertOctagon = createIcon(AlertDiamondIcon, "IconAlertOctagon")
export const IconInfoCircle = createIcon(
  InformationCircleIcon,
  "IconInfoCircle"
)
export const IconCircleCheck = createIcon(
  CheckmarkCircle02Icon,
  "IconCircleCheck"
)
export const IconCircleX = createIcon(CancelCircleIcon, "IconCircleX")
export const IconBan = createIcon(UnavailableIcon, "IconBan")
export const IconLoader = createIcon(Loading03Icon, "IconLoader")
export const IconPlayerPause = createIcon(PauseIcon, "IconPlayerPause")
export const IconClockPause = createIcon(Clock01Icon, "IconClockPause")
export const IconLockOpenOff = createIcon(SquareUnlock01Icon, "IconLockOpenOff")

// People and groups
export const IconUsers = createIcon(UserMultipleIcon, "IconUsers")
export const IconUserPlus = createIcon(UserAdd01Icon, "IconUserPlus")
export const IconUserCircle = createIcon(UserCircleIcon, "IconUserCircle")
export const IconUserQuestion = createIcon(
  UserQuestion01Icon,
  "IconUserQuestion"
)
export const IconBuildingCommunity = createIcon(
  Building06Icon,
  "IconBuildingCommunity"
)

// Appearance
export const IconSun = createIcon(Sun03Icon, "IconSun")
export const IconMoon = createIcon(Moon02Icon, "IconMoon")
export const IconDeviceDesktop = createIcon(ComputerIcon, "IconDeviceDesktop")

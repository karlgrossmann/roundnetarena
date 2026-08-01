import { Switch } from "@/components/ui/switch"
import { leaderboard_current_pool_only } from "@/paraglide/messages.js"

interface LeaderboardPoolFilterProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

/** Toggles between the league-wide table and one limited to today's pool. */
export function LeaderboardPoolFilter({
  checked,
  onCheckedChange,
}: LeaderboardPoolFilterProps) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm">
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
      <span>{leaderboard_current_pool_only()}</span>
    </label>
  )
}

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { initialsOf } from "@/lib/format"

interface PlayerAvatarProps {
  firstName: string
  lastName: string
  size?: "default" | "sm" | "lg"
  className?: string
}

/** There are no photos — the initials are not a placeholder, they are the depiction. */
export function PlayerAvatar({
  firstName,
  lastName,
  size = "default",
  className,
}: PlayerAvatarProps) {
  return (
    <Avatar size={size} className={className}>
      <AvatarFallback className="bg-primary font-medium text-primary-foreground">
        {initialsOf(firstName, lastName)}
      </AvatarFallback>
    </Avatar>
  )
}

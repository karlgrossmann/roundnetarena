import type { ReactNode } from "react"

import { BrandLogo } from "@/components/layout/BrandLogo"
import { LanguageSelect } from "@/components/language/LanguageSelect"
import { ThemeToggleGroup } from "@/components/theme/ThemeToggleGroup"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface AuthPageProps {
  title: string
  description: string
  children: ReactNode
  footer?: ReactNode
}

/**
 * Frame for the sign-in and account pages.
 *
 * No app bar: whoever is not signed in has neither navigation nor an account, so a bar
 * would have nothing to carry. Language and color scheme sit at the top edge in the
 * flow rather than absolutely positioned, so they do not run off short windows — the
 * logo above the card is in the flow for the same reason.
 */
export function AuthPage({
  title,
  description,
  children,
  footer,
}: AuthPageProps) {
  return (
    <div className="flex min-h-svh flex-col bg-muted/30">
      <div className="flex items-center justify-end gap-2 px-4 py-3">
        <LanguageSelect />
        <ThemeToggleGroup />
      </div>

      <main className="flex flex-1 items-center justify-center px-4 pt-2 pb-12">
        <div className="flex w-full max-w-sm flex-col items-center gap-6">
          <BrandLogo variant="full" className="size-28" />
          <Card className="w-full">
            <CardHeader>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>{children}</CardContent>
            {footer ? (
              <CardFooter className="justify-center">{footer}</CardFooter>
            ) : null}
          </Card>
        </div>
      </main>
    </div>
  )
}

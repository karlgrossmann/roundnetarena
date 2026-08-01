import {
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import {
  language_menu_label,
  language_name_de,
  language_name_en,
} from "@/paraglide/messages.js"
import { getLocale, setLocale } from "@/paraglide/runtime.js"
import type { Locale } from "@/paraglide/runtime.js"

const LOCALES: ReadonlyArray<Locale> = ["de", "en"]

function localeName(locale: Locale): string {
  return locale === "de" ? language_name_de() : language_name_en()
}

function isLocale(value: string): value is Locale {
  return LOCALES.some((locale) => locale === value)
}

/** Language choice as a menu group — identical in the account menu and the public view.
 *  `setLocale` reloads the page so the server messages match the choice. */
export function LanguageMenuItems() {
  const current = getLocale()

  return (
    <DropdownMenuRadioGroup
      value={current}
      onValueChange={(value) => {
        if (isLocale(value)) void setLocale(value)
      }}
    >
      <DropdownMenuLabel>{language_menu_label()}</DropdownMenuLabel>
      {LOCALES.map((locale) => (
        <DropdownMenuRadioItem key={locale} value={locale}>
          {localeName(locale)}
        </DropdownMenuRadioItem>
      ))}
    </DropdownMenuRadioGroup>
  )
}

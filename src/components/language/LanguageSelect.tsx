import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  language_menu_label,
  language_name_de,
  language_name_en,
} from "@/paraglide/messages.js"
import { getLocale, setLocale } from "@/paraglide/runtime.js"
import type { Locale } from "@/paraglide/runtime.js"

/** Language choice as a select — in settings and on the sign-in pages. Paraglide
 *  persists the choice in the locale cookie and reloads the page. */
export function LanguageSelect() {
  const items = {
    de: language_name_de(),
    en: language_name_en(),
  }

  return (
    <Select
      items={items}
      value={getLocale()}
      onValueChange={(locale) => void setLocale(locale as Locale)}
    >
      <SelectTrigger aria-label={language_menu_label()}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="de">{items.de}</SelectItem>
        <SelectItem value="en">{items.en}</SelectItem>
      </SelectContent>
    </Select>
  )
}

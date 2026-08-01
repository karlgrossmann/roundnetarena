/**
 * Deliberately untranslated: the brand name is identical in every language. Visible
 * sentences around it still belong in the Paraglide messages.
 */
export const APP_NAME = "Roundnet Arena"

/** Document title suffix: `History · Roundnet Arena`. */
export function documentTitle(pageTitle: string) {
  return `${pageTitle} · ${APP_NAME}`
}

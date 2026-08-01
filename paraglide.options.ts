/**
 * Paraglide options shared by every Vite context: the application (`vite.config.ts`) and
 * Storybook (`.storybook/main.ts`).
 *
 * They live here instead of being duplicated in both configs, because a drift would only
 * surface once a locale strategy took effect in one of the two places.
 *
 * The values must match the `i18n:compile` script in `package.json`.
 */

/**
 * Order in which the locale is resolved. Deliberately typed as mutable — the Paraglide
 * plugin does not accept a `readonly` list.
 */
const strategy: Array<"cookie" | "preferredLanguage" | "baseLocale"> = [
  "cookie",
  "preferredLanguage",
  "baseLocale",
]

export const paraglideOptions = {
  project: "./project.inlang",
  outdir: "./src/paraglide",
  outputStructure: "message-modules" as const,
  emitTsDeclarations: true,
  cookieName: "PARAGLIDE_LOCALE",
  cookieMaxAge: 60 * 60 * 24 * 365,
  strategy,
}

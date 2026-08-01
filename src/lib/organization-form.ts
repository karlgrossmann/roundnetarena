export function organizationSlug(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("en")
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
}

export function isValidOrganizationSlug(value: string): boolean {
  return (
    value.length >= 3 &&
    value.length <= 48 &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
  )
}

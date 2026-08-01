import "@tanstack/react-start/server-only"

import { validateNormalizedOrganizationLogo } from "@/lib/organization-logo"

export interface OrganizationLogoWorkflowDependencies {
  removeUpload: (path: string) => Promise<void>
  publish: (
    organizationId: string,
    bytes: Uint8Array
  ) => Promise<{ publicUrl: string; previousBytes: Uint8Array | null }>
  restore: (
    organizationId: string,
    previousBytes: Uint8Array | null
  ) => Promise<void>
  removeObjects: (organizationId: string) => Promise<void>
  updateProfile: (organizationId: string, logo: string | null) => Promise<void>
}

export async function finalizeOrganizationLogo(
  input: {
    organizationId: string
    path: string
    bytes: Uint8Array
  },
  dependencies: OrganizationLogoWorkflowDependencies
): Promise<string> {
  validateNormalizedOrganizationLogo(input.bytes)
  await dependencies.removeUpload(input.path)
  const published = await dependencies.publish(
    input.organizationId,
    input.bytes
  )
  const version = input.path.slice(
    input.path.lastIndexOf("/") + 1,
    -".webp".length
  )
  const logo = `${published.publicUrl}?v=${encodeURIComponent(version)}`
  try {
    await dependencies.updateProfile(input.organizationId, logo)
  } catch (error) {
    await dependencies.restore(input.organizationId, published.previousBytes)
    throw error
  }
  return logo
}

export async function clearOrganizationLogo(
  organizationId: string,
  previousLogo: string | null,
  dependencies: OrganizationLogoWorkflowDependencies
): Promise<void> {
  await dependencies.updateProfile(organizationId, null)
  try {
    await dependencies.removeObjects(organizationId)
  } catch (error) {
    await dependencies.updateProfile(organizationId, previousLogo)
    throw error
  }
}

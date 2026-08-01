import "@tanstack/react-start/server-only"

import { DomainError } from "@/lib/domain-errors"
import { validateOrganizationLogoInput } from "@/lib/organization-logo"
import type { OrganizationLogoInputType } from "@/lib/organization-logo"
import { hasOrganizationPermission } from "@/lib/organization-permissions"
import type { OrganizationDetails } from "@/lib/types"

import { throwOrganizationApiError } from "./organization-api-error.server"
import {
  clearOrganizationLogo,
  finalizeOrganizationLogo,
} from "./organization-logo-workflow.server"
import { getAuth } from "../auth/auth"
import { getStorageEnvironment } from "../config"
import { getDb } from "../db/client"
import { findOrganizationDetails } from "../repositories/organizations"
import {
  ORGANIZATION_LOGO_UPLOAD_BUCKET,
  createSignedOrganizationLogoUpload,
  downloadOrganizationLogoUpload,
  publishOrganizationLogo,
  removeOrganizationLogoObjects,
  removeOrganizationLogoUpload,
  restoreOrganizationLogo,
} from "../storage/organization-logos.server"
import {
  createOrganizationLogoUploadGrant,
  verifyOrganizationLogoUploadGrant,
} from "../storage/organization-logo-grant.server"

interface AuthorizedOrganizationInput {
  organizationId: string
  userId: string
  activeOrganizationId: string | null
}

export async function prepareOrganizationLogoUploadAction(
  input: AuthorizedOrganizationInput & {
    contentType: OrganizationLogoInputType
    base64: string
  }
) {
  await requireOrganizationUpdate(input)
  const bytes = Uint8Array.from(Buffer.from(input.base64, "base64"))
  validateOrganizationLogoInput(bytes, input.contentType)

  const environment = getStorageEnvironment()
  const uploadGrant = createOrganizationLogoUploadGrant(
    input.organizationId,
    environment.secretKey
  )
  const signedUpload = await createSignedOrganizationLogoUpload(
    uploadGrant.path
  )
  return {
    ...uploadGrant,
    bucket: ORGANIZATION_LOGO_UPLOAD_BUCKET,
    token: signedUpload.token,
    signedUrl: signedUpload.signedUrl,
  }
}

export async function confirmOrganizationLogoUploadAction(
  input: AuthorizedOrganizationInput & { grant: string }
): Promise<OrganizationDetails> {
  await requireOrganizationUpdate(input)
  const environment = getStorageEnvironment()
  const grant = verifyOrganizationLogoUploadGrant(
    input.grant,
    input.organizationId,
    environment.secretKey
  )
  const bytes = await downloadOrganizationLogoUpload(grant.path)
  await finalizeOrganizationLogo(
    {
      organizationId: input.organizationId,
      path: grant.path,
      bytes,
    },
    organizationLogoWorkflowDependencies
  )
  return requireOrganizationUpdate(input)
}

export async function removeOrganizationLogoAction(
  input: AuthorizedOrganizationInput
): Promise<OrganizationDetails> {
  const details = await requireOrganizationUpdate(input)
  await clearOrganizationLogo(
    input.organizationId,
    details.organization.logo,
    organizationLogoWorkflowDependencies
  )
  return requireOrganizationUpdate(input)
}

async function requireOrganizationUpdate({
  organizationId,
  userId,
  activeOrganizationId,
}: AuthorizedOrganizationInput): Promise<OrganizationDetails> {
  const details = await findOrganizationDetails(
    getDb(),
    organizationId,
    userId,
    activeOrganizationId,
    new Date()
  )
  if (!details) throw new DomainError("organization.not_found")
  if (
    !hasOrganizationPermission(details.organization.role, "organization:update")
  ) {
    throw new DomainError("organization.forbidden")
  }
  return details
}

async function updateOrganizationLogo(
  organizationId: string,
  logo: string | null
): Promise<void> {
  const headers = await requestHeaders()
  try {
    await getAuth().api.updateOrganization({
      headers,
      body: {
        organizationId,
        data: { logo },
      },
    })
  } catch (error) {
    throwOrganizationApiError(error)
  }
}

async function requestHeaders(): Promise<Headers> {
  const { getRequestHeaders } = await import("@tanstack/react-start/server")
  return getRequestHeaders()
}

const organizationLogoWorkflowDependencies = {
  removeUpload: removeOrganizationLogoUpload,
  publish: publishOrganizationLogo,
  restore: restoreOrganizationLogo,
  removeObjects: removeOrganizationLogoObjects,
  updateProfile: updateOrganizationLogo,
}

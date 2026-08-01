import "@tanstack/react-start/server-only"

import { APIError } from "better-auth/api"

import { DomainError } from "@/lib/domain-errors"
import type { DomainIssueCode } from "@/lib/domain-errors"

const codeMap: Readonly<Record<string, DomainIssueCode>> = {
  YOU_ARE_NOT_ALLOWED_TO_CREATE_A_NEW_ORGANIZATION:
    "organization.limit_reached",
  ORGANIZATION_ALREADY_EXISTS: "organization.slug_taken",
  ORGANIZATION_SLUG_ALREADY_TAKEN: "organization.slug_taken",
  YOU_HAVE_REACHED_THE_MAXIMUM_NUMBER_OF_ORGANIZATIONS:
    "organization.limit_reached",
  INVITATION_LIMIT_REACHED: "organization.invitation_limit_reached",
  USER_IS_ALREADY_A_MEMBER_OF_THIS_ORGANIZATION: "organization.member_exists",
  YOU_CANNOT_LEAVE_THE_ORGANIZATION_AS_THE_ONLY_OWNER:
    "organization.last_owner",
  YOU_CANNOT_LEAVE_THE_ORGANIZATION_WITHOUT_AN_OWNER: "organization.last_owner",
  INVITATION_NOT_FOUND: "organization.invitation_invalid",
  YOU_ARE_NOT_THE_RECIPIENT_OF_THE_INVITATION:
    "organization.invitation_recipient_mismatch",
  ORGANIZATION_NOT_FOUND: "organization.not_found",
  MEMBER_NOT_FOUND: "organization.not_found",
  USER_IS_NOT_A_MEMBER_OF_THE_ORGANIZATION: "organization.forbidden",
  YOU_ARE_NOT_ALLOWED_TO_UPDATE_THIS_ORGANIZATION: "organization.forbidden",
  YOU_ARE_NOT_ALLOWED_TO_UPDATE_THIS_MEMBER: "organization.forbidden",
  YOU_ARE_NOT_ALLOWED_TO_DELETE_THIS_MEMBER: "organization.forbidden",
  YOU_ARE_NOT_ALLOWED_TO_INVITE_USERS_TO_THIS_ORGANIZATION:
    "organization.forbidden",
  YOU_ARE_NOT_ALLOWED_TO_INVITE_USER_WITH_THIS_ROLE: "organization.forbidden",
  YOU_ARE_NOT_ALLOWED_TO_CANCEL_THIS_INVITATION: "organization.forbidden",
}

export function throwOrganizationApiError(error: unknown): never {
  if (error instanceof APIError) {
    const body: unknown = error.body
    const apiCode =
      typeof body === "object" &&
      body !== null &&
      "code" in body &&
      typeof body.code === "string"
        ? body.code
        : undefined
    const code = apiCode ? codeMap[apiCode] : undefined
    throw new DomainError(code ?? "organization.action_failed")
  }
  throw error
}

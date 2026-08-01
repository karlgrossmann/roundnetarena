import {
  InvitationEmail,
  invitationPreviewProps,
} from "../_templates/invitation"

export default function EnglishInvitationEmail() {
  return <InvitationEmail {...invitationPreviewProps} locale="en" />
}

import {
  InvitationEmail,
  invitationPreviewProps,
} from "../_templates/invitation"

export default function GermanInvitationEmail() {
  return <InvitationEmail {...invitationPreviewProps} locale="de" />
}

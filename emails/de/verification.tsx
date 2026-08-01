import {
  VerificationEmail,
  verificationPreviewProps,
} from "../_templates/verification"

export default function GermanVerificationEmail() {
  return <VerificationEmail {...verificationPreviewProps} locale="de" />
}

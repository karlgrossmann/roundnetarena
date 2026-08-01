import {
  VerificationEmail,
  verificationPreviewProps,
} from "../_templates/verification"

export default function EnglishVerificationEmail() {
  return <VerificationEmail {...verificationPreviewProps} locale="en" />
}

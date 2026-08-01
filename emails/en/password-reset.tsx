import {
  PasswordResetEmail,
  passwordResetPreviewProps,
} from "../_templates/password-reset"

export default function EnglishPasswordResetEmail() {
  return <PasswordResetEmail {...passwordResetPreviewProps} locale="en" />
}

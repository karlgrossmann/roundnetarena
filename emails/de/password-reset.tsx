import {
  PasswordResetEmail,
  passwordResetPreviewProps,
} from "../_templates/password-reset"

export default function GermanPasswordResetEmail() {
  return <PasswordResetEmail {...passwordResetPreviewProps} locale="de" />
}

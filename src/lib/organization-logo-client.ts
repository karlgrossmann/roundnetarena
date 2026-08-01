import { DomainError } from "./domain-errors"
import {
  ORGANIZATION_LOGO_MAX_BYTES,
  ORGANIZATION_LOGO_OUTPUT_DIMENSION,
  isOrganizationLogoInputType,
} from "./organization-logo"
import type { OrganizationLogoInputType } from "./organization-logo"

export interface OrganizationLogoFilePayload {
  base64: string
  contentType: OrganizationLogoInputType
}

export async function organizationLogoFilePayload(
  file: File
): Promise<OrganizationLogoFilePayload> {
  if (!isOrganizationLogoInputType(file.type)) {
    throw new DomainError("organization.logo_invalid_type")
  }
  if (file.size > ORGANIZATION_LOGO_MAX_BYTES) {
    throw new DomainError("organization.logo_too_large")
  }
  const dataUrl = await readAsDataUrl(file)
  const separator = dataUrl.indexOf(",")
  if (separator === -1) {
    throw new DomainError("organization.logo_invalid_image")
  }
  return {
    contentType: file.type,
    base64: dataUrl.slice(separator + 1),
  }
}

export async function normalizeOrganizationLogo(file: File): Promise<Blob> {
  let image: ImageBitmap
  try {
    image = await createImageBitmap(file)
  } catch {
    throw new DomainError("organization.logo_invalid_image")
  }

  try {
    const canvas = document.createElement("canvas")
    canvas.width = ORGANIZATION_LOGO_OUTPUT_DIMENSION
    canvas.height = ORGANIZATION_LOGO_OUTPUT_DIMENSION
    const context = canvas.getContext("2d")
    if (!context) throw new DomainError("organization.logo_invalid_image")

    const cropSize = Math.min(image.width, image.height)
    const sourceX = (image.width - cropSize) / 2
    const sourceY = (image.height - cropSize) / 2
    context.drawImage(
      image,
      sourceX,
      sourceY,
      cropSize,
      cropSize,
      0,
      0,
      ORGANIZATION_LOGO_OUTPUT_DIMENSION,
      ORGANIZATION_LOGO_OUTPUT_DIMENSION
    )
    const blob = await canvasToWebp(canvas)
    if (blob.type !== "image/webp") {
      throw new DomainError("organization.logo_invalid_image")
    }
    return blob
  } finally {
    image.close()
  }
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.addEventListener(
      "load",
      () => {
        if (typeof reader.result === "string") resolve(reader.result)
        else reject(new DomainError("organization.logo_invalid_image"))
      },
      { once: true }
    )
    reader.addEventListener(
      "error",
      () => reject(new DomainError("organization.logo_invalid_image")),
      { once: true }
    )
    reader.readAsDataURL(file)
  })
}

function canvasToWebp(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new DomainError("organization.logo_invalid_image"))
      },
      "image/webp",
      0.88
    )
  })
}

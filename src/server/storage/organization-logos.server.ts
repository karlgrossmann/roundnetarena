import "@tanstack/react-start/server-only"

import { createClient } from "@supabase/supabase-js"
import type { SupabaseClient } from "@supabase/supabase-js"

import { DomainError } from "@/lib/domain-errors"
import { ORGANIZATION_LOGO_MAX_BYTES } from "@/lib/organization-logo"

import { getStorageEnvironment } from "../config"

export const ORGANIZATION_LOGO_BUCKET = "organization-logos"
export const ORGANIZATION_LOGO_UPLOAD_BUCKET = "organization-logo-uploads"

let client: SupabaseClient | null = null
let bucketsReady: Promise<void> | null = null

export interface SignedOrganizationLogoUpload {
  path: string
  token: string
  signedUrl: string
}

export interface PublishedOrganizationLogo {
  publicUrl: string
  previousBytes: Uint8Array | null
}

export async function createSignedOrganizationLogoUpload(
  path: string
): Promise<SignedOrganizationLogoUpload> {
  await ensureOrganizationLogoBuckets()
  const { data, error } = await storageClient()
    .from(ORGANIZATION_LOGO_UPLOAD_BUCKET)
    .createSignedUploadUrl(path, { upsert: true })
  if (error) throw storageFailure()
  return data
}

export async function downloadOrganizationLogoUpload(
  path: string
): Promise<Uint8Array> {
  const { data, error } = await storageClient()
    .from(ORGANIZATION_LOGO_UPLOAD_BUCKET)
    .download(path)
  if (error) throw storageFailure()
  return new Uint8Array(await data.arrayBuffer())
}

export async function publishOrganizationLogo(
  organizationId: string,
  bytes: Uint8Array
): Promise<PublishedOrganizationLogo> {
  await ensureOrganizationLogoBuckets()
  const bucket = storageClient().from(ORGANIZATION_LOGO_BUCKET)
  const path = organizationLogoPath(organizationId)
  const previousBytes = await downloadOptional(bucket, path)
  const { error } = await bucket.upload(path, bytes, {
    cacheControl: "31536000",
    contentType: "image/webp",
    upsert: true,
  })
  if (error) throw storageFailure()
  return {
    publicUrl: bucket.getPublicUrl(path).data.publicUrl,
    previousBytes,
  }
}

export async function restoreOrganizationLogo(
  organizationId: string,
  previousBytes: Uint8Array | null
): Promise<void> {
  const bucket = storageClient().from(ORGANIZATION_LOGO_BUCKET)
  const path = organizationLogoPath(organizationId)
  if (previousBytes) {
    const { error } = await bucket.upload(path, previousBytes, {
      cacheControl: "31536000",
      contentType: "image/webp",
      upsert: true,
    })
    if (error) throw storageFailure()
    return
  }
  const { error } = await bucket.remove([path])
  if (error) throw storageFailure()
}

export async function removeOrganizationLogoObjects(
  organizationId: string
): Promise<void> {
  await ensureOrganizationLogoBuckets()
  const [publishedResult, pendingResult] = await Promise.all([
    storageClient()
      .from(ORGANIZATION_LOGO_BUCKET)
      .remove([organizationLogoPath(organizationId)]),
    storageClient()
      .from(ORGANIZATION_LOGO_UPLOAD_BUCKET)
      .list(organizationId, { limit: 100 }),
  ])
  if (publishedResult.error || pendingResult.error) throw storageFailure()
  if (pendingResult.data.length === 0) return
  const { error } = await storageClient()
    .from(ORGANIZATION_LOGO_UPLOAD_BUCKET)
    .remove(
      pendingResult.data.map((entry) => `${organizationId}/${entry.name}`)
    )
  if (error) throw storageFailure()
}

export async function removeOrganizationLogoUpload(
  path: string
): Promise<void> {
  const { error } = await storageClient()
    .from(ORGANIZATION_LOGO_UPLOAD_BUCKET)
    .remove([path])
  if (error) throw storageFailure()
}

export function organizationLogoPath(organizationId: string): string {
  return `${organizationId}/logo.webp`
}

async function ensureOrganizationLogoBuckets(): Promise<void> {
  if (!bucketsReady) {
    bucketsReady = Promise.all([
      ensureBucket(ORGANIZATION_LOGO_BUCKET, true),
      ensureBucket(ORGANIZATION_LOGO_UPLOAD_BUCKET, false),
    ])
      .then(() => undefined)
      .catch((error: unknown) => {
        bucketsReady = null
        throw error
      })
  }
  return bucketsReady
}

async function ensureBucket(bucket: string, isPublic: boolean): Promise<void> {
  const current = await storageClient().getBucket(bucket)
  if (!current.error) {
    await configureBucket(bucket, isPublic)
    return
  }
  if (String(current.error.statusCode) !== "404") throw storageFailure()

  const created = await storageClient().createBucket(bucket, {
    public: isPublic,
    fileSizeLimit: ORGANIZATION_LOGO_MAX_BYTES,
    allowedMimeTypes: ["image/webp"],
  })
  if (!created.error) return

  const raced = await storageClient().getBucket(bucket)
  if (raced.error) throw storageFailure()
  await configureBucket(bucket, isPublic)
}

async function configureBucket(
  bucket: string,
  isPublic: boolean
): Promise<void> {
  const updated = await storageClient().updateBucket(bucket, {
    public: isPublic,
    fileSizeLimit: ORGANIZATION_LOGO_MAX_BYTES,
    allowedMimeTypes: ["image/webp"],
  })
  if (updated.error) throw storageFailure()
}

async function downloadOptional(
  bucket: ReturnType<SupabaseClient["storage"]["from"]>,
  path: string
): Promise<Uint8Array | null> {
  const { data, error } = await bucket.download(path)
  if (!error) return new Uint8Array(await data.arrayBuffer())
  if (String(error.statusCode) === "404") return null
  throw storageFailure()
}

function storageClient(): SupabaseClient["storage"] {
  if (client) return client.storage
  const environment = getStorageEnvironment()
  client = createClient(environment.url, environment.secretKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  })
  return client.storage
}

function storageFailure(): DomainError {
  return new DomainError("organization.logo_storage_failed")
}

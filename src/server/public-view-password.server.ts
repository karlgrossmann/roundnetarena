import "@tanstack/react-start/server-only"

import { randomBytes, scrypt, timingSafeEqual } from "node:crypto"

const KEY_LENGTH = 64

export async function hashPublicViewPassword(
  password: string
): Promise<string> {
  const salt = randomBytes(16)
  const derived = await derive(password, salt)
  return `scrypt$v=1$${salt.toString("base64url")}$${derived.toString("base64url")}`
}

export async function verifyPublicViewPassword(
  password: string,
  encoded: string
): Promise<boolean> {
  const parts = encoded.split("$")
  if (parts.length !== 4 || parts[0] !== "scrypt" || parts[1] !== "v=1") {
    return false
  }
  try {
    const salt = Buffer.from(parts[2], "base64url")
    const expected = Buffer.from(parts[3], "base64url")
    if (salt.length !== 16 || expected.length !== KEY_LENGTH) return false
    const actual = await derive(password, salt)
    return timingSafeEqual(actual, expected)
  } catch {
    return false
  }
}

function derive(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, KEY_LENGTH, (error, derivedKey) => {
      if (error) reject(error)
      else resolve(derivedKey)
    })
  })
}

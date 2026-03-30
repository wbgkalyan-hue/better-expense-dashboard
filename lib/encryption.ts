/**
 * AES-256-GCM encryption with cached session key.
 *
 * On sign-in the user's password + a shared per-user salt (stored in
 * Firestore user_settings) are fed into PBKDF2 to derive a CryptoKey.
 * The key is cached for the session; the password is kept in sessionStorage
 * so it survives page reloads within the same tab.
 *
 * Wire format: base64( salt[16] + iv[12] + ciphertext+authTag )
 * This is byte-compatible with the mobile app's @noble/ciphers implementation.
 */

const ALGORITHM = "AES-GCM"
const KEY_LENGTH = 256
const SALT_LENGTH = 16
const IV_LENGTH = 12
const PBKDF2_ITERATIONS = 600_000

let cachedKey: CryptoKey | null = null
let cachedSalt: Uint8Array | null = null

// ---------------------------------------------------------------------------
// Key derivation
// ---------------------------------------------------------------------------

async function deriveKey(
  password: string,
  salt: Uint8Array,
): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  )
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt.buffer as ArrayBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"],
  )
}

// ---------------------------------------------------------------------------
// Session lifecycle
// ---------------------------------------------------------------------------

export async function initEncryption(
  password: string,
  salt: Uint8Array,
): Promise<void> {
  cachedKey = await deriveKey(password, salt)
  cachedSalt = new Uint8Array(salt)
}

export function clearEncryption(): void {
  cachedKey = null
  cachedSalt = null
}

export function isEncryptionReady(): boolean {
  return cachedKey !== null && cachedSalt !== null
}

// ---------------------------------------------------------------------------
// Encrypt / Decrypt individual fields
// ---------------------------------------------------------------------------

export async function encryptField(value: unknown): Promise<string> {
  if (!cachedKey || !cachedSalt) {
    throw new Error("Encryption not initialized")
  }
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const plaintext = new TextEncoder().encode(JSON.stringify(value))
  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    cachedKey,
    plaintext,
  )
  const combined = new Uint8Array(
    SALT_LENGTH + IV_LENGTH + ciphertext.byteLength,
  )
  combined.set(cachedSalt, 0)
  combined.set(iv, SALT_LENGTH)
  combined.set(new Uint8Array(ciphertext), SALT_LENGTH + IV_LENGTH)
  return btoa(String.fromCharCode(...combined))
}

export async function decryptField<T>(encoded: string): Promise<T> {
  if (!cachedKey || !cachedSalt) {
    throw new Error("Encryption not initialized")
  }
  const combined = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0))
  const salt = combined.slice(0, SALT_LENGTH)
  const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
  const ciphertext = combined.slice(SALT_LENGTH + IV_LENGTH)

  let key: CryptoKey
  if (salt.every((b, i) => b === cachedSalt![i])) {
    key = cachedKey
  } else {
    // Data encrypted with a different salt — cannot decrypt without password
    throw new Error("Salt mismatch — data was encrypted with a different key")
  }

  const plaintext = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    ciphertext,
  )
  return JSON.parse(new TextDecoder().decode(plaintext)) as T
}

// ---------------------------------------------------------------------------
// Salt helpers
// ---------------------------------------------------------------------------

export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
}

export function saltToBase64(salt: Uint8Array): string {
  return btoa(String.fromCharCode(...salt))
}

export function base64ToSalt(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
}

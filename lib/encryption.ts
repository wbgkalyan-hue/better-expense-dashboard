/**
 * Client-side AES-256-GCM encryption/decryption using Web Crypto API.
 * Used to decrypt transaction data fetched from Firestore (stored as ciphertext).
 */

const ALGORITHM = "AES-GCM"
const KEY_LENGTH = 256
const IV_LENGTH = 12 // 96 bits recommended for AES-GCM

/**
 * Derive an AES-256 key from a password using PBKDF2.
 */
export async function deriveKey(
  password: string,
  salt: Uint8Array<ArrayBuffer>,
): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  )

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 600_000, // OWASP recommended minimum
      hash: "SHA-256",
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"],
  )
}

/**
 * Encrypt plaintext string → base64 encoded ciphertext (iv + salt + ciphertext).
 */
export async function encrypt(
  plaintext: string,
  password: string,
): Promise<string> {
  const encoder = new TextEncoder()
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH)) as Uint8Array<ArrayBuffer>
  const salt = crypto.getRandomValues(new Uint8Array(16)) as Uint8Array<ArrayBuffer>
  const key = await deriveKey(password, salt)

  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encoder.encode(plaintext),
  )

  // Combine: salt (16) + iv (12) + ciphertext
  const combined = new Uint8Array(
    salt.length + iv.length + ciphertext.byteLength,
  )
  combined.set(salt, 0)
  combined.set(iv, salt.length)
  combined.set(new Uint8Array(ciphertext), salt.length + iv.length)

  return btoa(String.fromCharCode(...combined))
}

/**
 * Decrypt base64 ciphertext → plaintext string.
 */
export async function decrypt(
  encoded: string,
  password: string,
): Promise<string> {
  const combined = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0))

  const salt = combined.slice(0, 16)
  const iv = combined.slice(16, 16 + IV_LENGTH)
  const ciphertext = combined.slice(16 + IV_LENGTH)

  const key = await deriveKey(password, salt)

  const plaintext = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    ciphertext,
  )

  return new TextDecoder().decode(plaintext)
}

/**
 * Encrypt a JSON-serializable object.
 */
export async function encryptObject<T>(
  data: T,
  password: string,
): Promise<string> {
  return encrypt(JSON.stringify(data), password)
}

/**
 * Decrypt to a JSON object.
 */
export async function decryptObject<T>(
  encoded: string,
  password: string,
): Promise<T> {
  const json = await decrypt(encoded, password)
  return JSON.parse(json) as T
}

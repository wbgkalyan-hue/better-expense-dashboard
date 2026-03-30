/**
 * Dashboard Encryption Tests
 *
 * Tests AES-256-GCM encryption/decryption, key derivation, salt helpers,
 * and cross-compatibility wire format with the mobile app.
 */
import { describe, it, expect, beforeEach } from "vitest"
import {
  initEncryption,
  clearEncryption,
  isEncryptionReady,
  encryptField,
  decryptField,
  generateSalt,
  saltToBase64,
  base64ToSalt,
} from "@/lib/encryption"

const TEST_PASSWORD = "test-password-123!"

describe("Encryption — Salt Helpers", () => {
  it("generateSalt returns 16 bytes", () => {
    const salt = generateSalt()
    expect(salt).toBeInstanceOf(Uint8Array)
    expect(salt.length).toBe(16)
  })

  it("saltToBase64 and base64ToSalt are inverse operations", () => {
    const salt = generateSalt()
    const b64 = saltToBase64(salt)
    expect(typeof b64).toBe("string")
    const restored = base64ToSalt(b64)
    expect(restored).toEqual(salt)
  })

  it("generateSalt produces unique values", () => {
    const a = saltToBase64(generateSalt())
    const b = saltToBase64(generateSalt())
    expect(a).not.toBe(b)
  })
})

describe("Encryption — Lifecycle", () => {
  beforeEach(() => {
    clearEncryption()
  })

  it("isEncryptionReady is false before init", () => {
    expect(isEncryptionReady()).toBe(false)
  })

  it("isEncryptionReady is true after init", async () => {
    const salt = generateSalt()
    await initEncryption(TEST_PASSWORD, salt)
    expect(isEncryptionReady()).toBe(true)
  })

  it("clearEncryption resets ready state", async () => {
    const salt = generateSalt()
    await initEncryption(TEST_PASSWORD, salt)
    expect(isEncryptionReady()).toBe(true)
    clearEncryption()
    expect(isEncryptionReady()).toBe(false)
  })

  it("encryptField throws when not initialized", async () => {
    await expect(encryptField("hello")).rejects.toThrow(
      "Encryption not initialized",
    )
  })

  it("decryptField throws when not initialized", async () => {
    await expect(decryptField("aGVsbG8=")).rejects.toThrow(
      "Encryption not initialized",
    )
  })
})

describe("Encryption — Encrypt / Decrypt Fields", () => {
  const salt = generateSalt()

  beforeEach(async () => {
    clearEncryption()
    await initEncryption(TEST_PASSWORD, salt)
  })

  it("encrypts and decrypts a string", async () => {
    const original = "Hello World"
    const encrypted = await encryptField(original)
    expect(typeof encrypted).toBe("string")
    expect(encrypted).not.toBe(original) // must not be plaintext
    const decrypted = await decryptField<string>(encrypted)
    expect(decrypted).toBe(original)
  })

  it("encrypts and decrypts a number", async () => {
    const original = 12345.67
    const encrypted = await encryptField(original)
    const decrypted = await decryptField<number>(encrypted)
    expect(decrypted).toBe(original)
  })

  it("encrypts and decrypts zero", async () => {
    const encrypted = await encryptField(0)
    const decrypted = await decryptField<number>(encrypted)
    expect(decrypted).toBe(0)
  })

  it("encrypts and decrypts negative numbers", async () => {
    const encrypted = await encryptField(-500.25)
    const decrypted = await decryptField<number>(encrypted)
    expect(decrypted).toBe(-500.25)
  })

  it("encrypts and decrypts a boolean", async () => {
    const encrypted = await encryptField(true)
    const decrypted = await decryptField<boolean>(encrypted)
    expect(decrypted).toBe(true)
  })

  it("encrypts and decrypts null", async () => {
    const encrypted = await encryptField(null)
    const decrypted = await decryptField<null>(encrypted)
    expect(decrypted).toBeNull()
  })

  it("encrypts and decrypts an object", async () => {
    const obj = { amount: 1500, description: "Rent payment" }
    const encrypted = await encryptField(obj)
    const decrypted = await decryptField<typeof obj>(encrypted)
    expect(decrypted).toEqual(obj)
  })

  it("produces different ciphertext for same plaintext (random IV)", async () => {
    const value = "same value"
    const e1 = await encryptField(value)
    const e2 = await encryptField(value)
    expect(e1).not.toBe(e2) // IVs differ
    // Both decrypt to same value
    expect(await decryptField<string>(e1)).toBe(value)
    expect(await decryptField<string>(e2)).toBe(value)
  })

  it("wire format: base64(salt[16] + iv[12] + ciphertext)", async () => {
    const encrypted = await encryptField("test")
    const raw = Uint8Array.from(atob(encrypted), (c) => c.charCodeAt(0))
    // Minimum: 16 (salt) + 12 (iv) + 1 (at least some ciphertext)
    expect(raw.length).toBeGreaterThanOrEqual(29)
    // First 16 bytes should be the salt we used
    const embeddedSalt = raw.slice(0, 16)
    const expectedSalt = base64ToSalt(saltToBase64(salt))
    expect(Array.from(embeddedSalt)).toEqual(Array.from(expectedSalt))
  })

  it("decryption with wrong key throws", async () => {
    const encrypted = await encryptField("secret")
    clearEncryption()
    const differentSalt = generateSalt()
    await initEncryption("wrong-password", differentSalt)
    // Salt mismatch should throw
    await expect(decryptField(encrypted)).rejects.toThrow()
  })
})

describe("Encryption — Key Derivation Consistency", () => {
  it("same password + salt always produces the same key", async () => {
    const salt = generateSalt()

    clearEncryption()
    await initEncryption(TEST_PASSWORD, salt)
    const encrypted = await encryptField("consistency check")

    clearEncryption()
    await initEncryption(TEST_PASSWORD, salt)
    const decrypted = await decryptField<string>(encrypted)
    expect(decrypted).toBe("consistency check")
  })

  it("different password with same salt cannot decrypt", async () => {
    const salt = generateSalt()

    clearEncryption()
    await initEncryption("password-A", salt)
    const encrypted = await encryptField("secret data")

    clearEncryption()
    await initEncryption("password-B", salt)
    // Same salt but different password → different key → decryption fails
    await expect(decryptField(encrypted)).rejects.toThrow()
  })
})

describe("Encryption — Unicode & Edge Cases", () => {
  const salt = generateSalt()

  beforeEach(async () => {
    clearEncryption()
    await initEncryption(TEST_PASSWORD, salt)
  })

  it("handles Unicode characters (Hindi/emoji)", async () => {
    const original = "₹5,000 paid to स्विगी 🍕"
    const encrypted = await encryptField(original)
    const decrypted = await decryptField<string>(encrypted)
    expect(decrypted).toBe(original)
  })

  it("handles empty string", async () => {
    const encrypted = await encryptField("")
    const decrypted = await decryptField<string>(encrypted)
    expect(decrypted).toBe("")
  })

  it("handles very long strings", async () => {
    const original = "x".repeat(10_000)
    const encrypted = await encryptField(original)
    const decrypted = await decryptField<string>(encrypted)
    expect(decrypted).toBe(original)
  })
})

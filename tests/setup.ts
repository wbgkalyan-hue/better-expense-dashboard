/**
 * Vitest setup — polyfill Web Crypto for Node.js environment.
 */
import { webcrypto } from "node:crypto"

// @ts-ignore - Polyfill for Node.js < 20
if (!globalThis.crypto?.subtle) {
  // @ts-ignore - crypto polyfill
  globalThis.crypto = webcrypto
}

// Polyfill btoa / atob if missing (Node 18)
if (typeof globalThis.btoa === "undefined") {
  globalThis.btoa = (str: string) => Buffer.from(str, "binary").toString("base64")
}
if (typeof globalThis.atob === "undefined") {
  globalThis.atob = (b64: string) => Buffer.from(b64, "base64").toString("binary")
}

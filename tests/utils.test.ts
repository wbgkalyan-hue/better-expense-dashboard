/**
 * Dashboard Utility Tests
 *
 * Tests the cn() utility function (tailwind-merge + clsx).
 */
import { describe, it, expect } from "vitest"
import { cn } from "@/lib/utils"

describe("cn() — Tailwind Class Merging", () => {
  it("merges simple classes", () => {
    expect(cn("px-4", "py-2")).toBe("px-4 py-2")
  })

  it("deduplicates conflicting tailwind classes", () => {
    const result = cn("px-4", "px-8")
    expect(result).toBe("px-8")
  })

  it("handles conditional classes", () => {
    const isActive = true
    const result = cn("text-sm", isActive && "font-bold")
    expect(result).toContain("font-bold")
  })

  it("handles falsy values", () => {
    const result = cn("text-sm", false, null, undefined, "text-blue-500")
    expect(result).toBe("text-sm text-blue-500")
  })

  it("handles empty input", () => {
    expect(cn()).toBe("")
  })

  it("handles array input via clsx", () => {
    const result = cn(["px-4", "py-2"])
    expect(result).toBe("px-4 py-2")
  })
})

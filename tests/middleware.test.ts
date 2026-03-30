/**
 * Dashboard Middleware Tests
 *
 * Validates auth-cookie-based route protection — public paths, redirects,
 * and authenticated access.
 */
import { describe, it, expect } from "vitest"
import { NextRequest, NextResponse } from "next/server"
import { middleware } from "@/middleware"

function makeRequest(pathname: string, hasCookie = false): NextRequest {
  const url = new URL(pathname, "http://localhost:3000")
  const req = new NextRequest(url)
  if (hasCookie) {
    req.cookies.set("__session", "mock-token")
  }
  return req
}

describe("Middleware — Public Paths", () => {
  it("allows /login without auth cookie", () => {
    const res = middleware(makeRequest("/login"))
    // NextResponse.next() returns status 200
    expect(res.status).not.toBe(307)
  })

  it("allows /register without auth cookie", () => {
    const res = middleware(makeRequest("/register"))
    expect(res.status).not.toBe(307)
  })

  it("allows /forgot-password without auth cookie", () => {
    const res = middleware(makeRequest("/forgot-password"))
    expect(res.status).not.toBe(307)
  })

  it("allows /_next/static assets without auth", () => {
    const res = middleware(makeRequest("/_next/static/chunk.js"))
    expect(res.status).not.toBe(307)
  })
})

describe("Middleware — Protected Paths", () => {
  it("redirects / to /login when no cookie", () => {
    const res = middleware(makeRequest("/"))
    expect(res.status).toBe(307)
    expect(res.headers.get("location")).toContain("/login")
  })

  it("redirects /expenses to /login when no cookie", () => {
    const res = middleware(makeRequest("/expenses"))
    expect(res.status).toBe(307)
    expect(res.headers.get("location")).toContain("/login")
  })

  it("includes redirect param in login URL", () => {
    const res = middleware(makeRequest("/goals"))
    const location = res.headers.get("location")!
    expect(location).toContain("redirect=%2Fgoals")
  })

  it("allows / when cookie is present", () => {
    const res = middleware(makeRequest("/", true))
    expect(res.status).not.toBe(307)
  })

  it("allows /expenses when cookie is present", () => {
    const res = middleware(makeRequest("/expenses", true))
    expect(res.status).not.toBe(307)
  })
})

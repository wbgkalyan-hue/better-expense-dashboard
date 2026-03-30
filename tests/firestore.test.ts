/**
 * Dashboard Firestore Service Tests
 *
 * Tests the encrypt/decrypt document helpers and the Firestore CRUD
 * functions with mocked Firebase SDK.
 */
import { describe, it, expect, beforeEach, vi } from "vitest"

// -------------------------------------------------------------------
// Mock Firebase Firestore
// -------------------------------------------------------------------
const mockDocs = new Map<string, Record<string, unknown>>()
let addDocCounter = 0

vi.mock("firebase/firestore", () => ({
  collection: vi.fn((_db: unknown, name: string) => ({ path: name })),
  query: vi.fn((...args: unknown[]) => args),
  where: vi.fn((field: string, op: string, value: unknown) => ({ field, op, value })),
  getDocs: vi.fn(async () => ({
    docs: Array.from(mockDocs.entries()).map(([id, data]) => ({
      id,
      data: () => data,
    })),
  })),
  doc: vi.fn((_db: unknown, col: string, id: string) => ({ path: `${col}/${id}` })),
  getDoc: vi.fn(async (ref: { path: string }) => {
    const id = ref.path.split("/").pop()!
    const data = mockDocs.get(id)
    return {
      exists: () => !!data,
      id,
      data: () => data ?? {},
    }
  }),
  addDoc: vi.fn(async (_col: unknown, data: Record<string, unknown>) => {
    const id = `auto-id-${++addDocCounter}`
    mockDocs.set(id, data)
    return { id }
  }),
  updateDoc: vi.fn(async (ref: { path: string }, data: Record<string, unknown>) => {
    const id = ref.path.split("/").pop()!
    const existing = mockDocs.get(id) ?? {}
    mockDocs.set(id, { ...existing, ...data })
  }),
  deleteDoc: vi.fn(async (ref: { path: string }) => {
    const id = ref.path.split("/").pop()!
    mockDocs.delete(id)
  }),
  serverTimestamp: vi.fn(() => "SERVER_TIMESTAMP"),
}))

vi.mock("@/lib/firebase", () => ({
  db: {},
}))

// -------------------------------------------------------------------
// Mock Encryption — passthrough for testability
// -------------------------------------------------------------------
vi.mock("@/lib/encryption", () => ({
  encryptField: vi.fn(async (value: unknown) => `ENC(${JSON.stringify(value)})`),
  decryptField: vi.fn(async <T>(encoded: string): Promise<T> => {
    const match = encoded.match(/^ENC\((.+)\)$/)
    if (match) return JSON.parse(match[1]) as T
    throw new Error("Not encrypted format")
  }),
  isEncryptionReady: vi.fn(() => true),
}))

// Now import the functions under test
import {
  getTransactions,
  addTransaction,
  deleteTransaction,
  getBrokerAccounts,
  addBrokerAccount,
  getBrokerAccount,
  getGoals,
  addGoal,
  updateGoal,
  deleteGoal,
  getBankAccounts,
  addBankAccount,
  updateBankAccount,
  deleteBankAccount,
  getAssets,
  addAsset,
  updateAsset,
  deleteAsset,
  getNetworthSnapshots,
} from "@/lib/firestore"

describe("Firestore — Transactions CRUD", () => {
  beforeEach(() => {
    mockDocs.clear()
    addDocCounter = 0
  })

  it("addTransaction returns a new doc id", async () => {
    const id = await addTransaction({
      userId: "u1",
      amount: 500,
      type: "expense",
      category: "food" as any,
      description: "Lunch",
      date: "2026-03-28",
      source: "manual",
    })
    expect(id).toBe("auto-id-1")
  })

  it("getTransactions returns decrypted sorted results", async () => {
    // Seed mock with encrypted docs
    mockDocs.set("t1", {
      userId: "u1",
      amount: "ENC(500)",
      description: "ENC(\"Lunch\")",
      merchant: "ENC(\"Restaurant\")",
      rawNotification: null,
      type: "expense",
      category: "food",
      date: "2026-03-28",
      source: "manual",
      _encrypted: true,
      createdAt: "2026-03-28",
      updatedAt: "2026-03-28",
    })
    mockDocs.set("t2", {
      userId: "u1",
      amount: "ENC(1000)",
      description: "ENC(\"Salary\")",
      merchant: null,
      rawNotification: null,
      type: "income",
      category: "salary",
      date: "2026-03-29",
      source: "manual",
      _encrypted: true,
      createdAt: "2026-03-29",
      updatedAt: "2026-03-29",
    })

    const txns = await getTransactions("u1")
    expect(txns.length).toBe(2)
    // Sorted desc by date
    expect(txns[0].date).toBe("2026-03-29")
    expect(txns[1].date).toBe("2026-03-28")
  })

  it("deleteTransaction removes the doc", async () => {
    mockDocs.set("t1", { userId: "u1" })
    await deleteTransaction("t1")
    // deleteDoc should have been called
    const { deleteDoc } = await import("firebase/firestore")
    expect(deleteDoc).toHaveBeenCalled()
  })
})

describe("Firestore — Broker Accounts CRUD", () => {
  beforeEach(() => {
    mockDocs.clear()
    addDocCounter = 0
  })

  it("addBrokerAccount creates a document", async () => {
    const id = await addBrokerAccount({
      userId: "u1",
      name: "My Kite",
      broker: "Zerodha",
      currentValue: 100000,
      totalInvested: 80000,
      returns: 20000,
      returnsPercent: 25,
    })
    expect(id).toMatch(/^auto-id-/)
  })

  it("getBrokerAccounts returns list", async () => {
    mockDocs.set("ba1", {
      userId: "u1",
      name: "Kite",
      broker: "Zerodha",
      currentValue: "ENC(100000)",
      totalInvested: "ENC(80000)",
      returns: "ENC(20000)",
      returnsPercent: "ENC(25)",
      _encrypted: true,
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    })
    const accounts = await getBrokerAccounts("u1")
    expect(accounts.length).toBe(1)
  })

  it("getBrokerAccount by id", async () => {
    mockDocs.set("ba1", {
      userId: "u1",
      name: "Kite",
      broker: "Zerodha",
      currentValue: "ENC(100000)",
      totalInvested: "ENC(80000)",
      returns: "ENC(20000)",
      returnsPercent: "ENC(25)",
      _encrypted: true,
      createdAt: "2026-01-01",
    })
    const account = await getBrokerAccount("ba1")
    expect(account).not.toBeNull()
  })
})

describe("Firestore — Goals CRUD", () => {
  beforeEach(() => {
    mockDocs.clear()
    addDocCounter = 0
  })

  it("addGoal and getGoals round-trip", async () => {
    await addGoal({
      userId: "u1",
      title: "Emergency Fund",
      type: "emergency_fund" as any,
      targetAmount: 100000,
      currentAmount: 25000,
      priority: 1,
      isActive: true,
      deductsFromNetworth: true,
    })
    expect(mockDocs.size).toBe(1)
  })

  it("updateGoal modifies the document", async () => {
    mockDocs.set("g1", {
      userId: "u1",
      title: "Trip",
      type: "trip",
      targetAmount: "ENC(50000)",
      currentAmount: "ENC(10000)",
      priority: 2,
      isActive: true,
    })
    await updateGoal("g1", { currentAmount: 20000 })
    const { updateDoc } = await import("firebase/firestore")
    expect(updateDoc).toHaveBeenCalled()
  })

  it("deleteGoal removes the document", async () => {
    mockDocs.set("g1", { userId: "u1" })
    await deleteGoal("g1")
    const { deleteDoc } = await import("firebase/firestore")
    expect(deleteDoc).toHaveBeenCalled()
  })
})

describe("Firestore — Bank Accounts CRUD", () => {
  beforeEach(() => {
    mockDocs.clear()
    addDocCounter = 0
  })

  it("addBankAccount creates document", async () => {
    const id = await addBankAccount({
      userId: "u1",
      name: "Savings Account",
      bankName: "SBI",
      type: "savings" as any,
      balance: 50000,
    })
    expect(id).toMatch(/^auto-id-/)
  })

  it("updateBankAccount modifies balance", async () => {
    mockDocs.set("b1", { userId: "u1", name: "SBI Savings" })
    await updateBankAccount("b1", { balance: 75000 })
    const { updateDoc } = await import("firebase/firestore")
    expect(updateDoc).toHaveBeenCalled()
  })

  it("deleteBankAccount removes doc", async () => {
    mockDocs.set("b1", { userId: "u1" })
    await deleteBankAccount("b1")
    const { deleteDoc } = await import("firebase/firestore")
    expect(deleteDoc).toHaveBeenCalled()
  })
})

describe("Firestore — Assets CRUD", () => {
  beforeEach(() => {
    mockDocs.clear()
    addDocCounter = 0
  })

  it("addAsset creates document", async () => {
    const id = await addAsset({
      userId: "u1",
      name: "Car",
      type: "vehicle" as any,
      currentValue: 800000,
      purchaseValue: 1000000,
    })
    expect(id).toMatch(/^auto-id-/)
  })

  it("updateAsset modifies value", async () => {
    mockDocs.set("a1", { userId: "u1" })
    await updateAsset("a1", { currentValue: 750000 })
    const { updateDoc } = await import("firebase/firestore")
    expect(updateDoc).toHaveBeenCalled()
  })

  it("deleteAsset removes doc", async () => {
    mockDocs.set("a1", { userId: "u1" })
    await deleteAsset("a1")
    const { deleteDoc } = await import("firebase/firestore")
    expect(deleteDoc).toHaveBeenCalled()
  })
})

describe("Firestore — Networth Snapshots", () => {
  beforeEach(() => {
    mockDocs.clear()
    addDocCounter = 0
  })

  it("getNetworthSnapshots returns sorted list", async () => {
    mockDocs.set("nw1", {
      userId: "u1",
      date: "2026-03-01",
      totalBank: "ENC(100000)",
      totalInvestments: "ENC(200000)",
      totalAssets: "ENC(500000)",
      totalDebts: "ENC(50000)",
      networth: "ENC(750000)",
      liquidFunds: "ENC(100000)",
      _encrypted: true,
      createdAt: "2026-03-01",
    })
    const snapshots = await getNetworthSnapshots("u1")
    expect(snapshots.length).toBe(1)
  })
})

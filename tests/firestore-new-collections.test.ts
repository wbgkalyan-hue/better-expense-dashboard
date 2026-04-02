import { describe, it, expect, beforeEach, vi } from "vitest"

const mockDocs = new Map<string, Record<string, unknown>>()
let addDocCounter = 0

vi.mock("firebase/firestore", () => ({
  collection: vi.fn((_db: unknown, name: string) => ({ path: name })),
  query: vi.fn((...args: unknown[]) => args),
  where: vi.fn((field: string, op: string, value: unknown) => ({ field, op, value })),
  getDocs: vi.fn(async () => ({
    docs: Array.from(mockDocs.entries()).map(([id, data]) => ({ id, data: () => data })),
  })),
  doc: vi.fn((_db: unknown, col: string, id: string) => ({ path: `${col}/${id}` })),
  getDoc: vi.fn(async (ref: { path: string }) => {
    const id = ref.path.split("/").pop()!
    const data = mockDocs.get(id)
    return { exists: () => !!data, id, data: () => data ?? {} }
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

vi.mock("@/lib/firebase", () => ({ db: {} }))

vi.mock("@/lib/encryption", () => ({
  encryptField: vi.fn(async (value: unknown) => `ENC(${JSON.stringify(value)})`),
  decryptField: vi.fn(async <T>(encoded: string): Promise<T> => {
    const match = encoded.match(/^ENC\((.+)\)$/)
    if (match) return JSON.parse(match[1]) as T
    throw new Error("Not encrypted format")
  }),
  isEncryptionReady: vi.fn(() => true),
}))

import {
  getRealEstateInvestments, addRealEstateInvestment, deleteRealEstateInvestment,
  getInsurancePolicies, addInsurancePolicy, deleteInsurancePolicy,
  getCreditCards, addCreditCard, deleteCreditCard,
  getLoans, addLoan, deleteLoan,
  getFriends, addFriend, deleteFriend,
  getFamilyMembers, addFamilyMember, deleteFamilyMember,
  getFriendsLedger, addFriendsLedgerEntry, deleteFriendsLedgerEntry,
  getFamilyLedger, addFamilyLedgerEntry, deleteFamilyLedgerEntry,
  getProperties, addProperty, deleteProperty,
} from "@/lib/firestore"

// ---------------------------------------------------------------------------
// Real Estate Investments
// ---------------------------------------------------------------------------
describe("Firestore — Real Estate Investments", () => {
  beforeEach(() => {
    mockDocs.clear()
    addDocCounter = 0
  })

  it("addRealEstateInvestment returns an id", async () => {
    const result = await addRealEstateInvestment({
      userId: "u1",
      name: "Plot A",
      location: "Mumbai",
      type: "land",
      purchasePrice: 500000,
      currentValue: 700000,
      purchaseDate: "2023-01-01",
    })
    expect(result).toMatch(/^auto-id-/)
  })

  it("getRealEstateInvestments decrypts sensitive fields", async () => {
    mockDocs.set("rei-1", {
      userId: "u1",
      purchasePrice: "ENC(500000)",
      currentValue: "ENC(700000)",
      _encrypted: true,
      purchaseDate: "2023-01-01",
      name: "Plot A",
      location: "Mumbai",
      type: "land",
    })
    const results = await getRealEstateInvestments("u1")
    expect(results).toHaveLength(1)
    expect(results[0].purchasePrice).toBe(500000)
  })

  it("deleteRealEstateInvestment removes doc", async () => {
    mockDocs.set("rei-1", {
      userId: "u1",
      purchasePrice: "ENC(500000)",
      currentValue: "ENC(700000)",
      _encrypted: true,
      purchaseDate: "2023-01-01",
      name: "Plot A",
      location: "Mumbai",
      type: "land",
    })
    await deleteRealEstateInvestment("rei-1")
    expect(mockDocs.size).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Insurance Policies
// ---------------------------------------------------------------------------
describe("Firestore — Insurance Policies", () => {
  beforeEach(() => {
    mockDocs.clear()
    addDocCounter = 0
  })

  it("addInsurancePolicy returns an id", async () => {
    const result = await addInsurancePolicy({
      userId: "u1",
      name: "Term Life",
      insurer: "LIC",
      type: "term",
      premium: 12000,
      coverageAmount: 5000000,
      startDate: "2024-01-01",
      frequency: "yearly",
    })
    expect(result).toMatch(/^auto-id-/)
  })

  it("getInsurancePolicies decrypts sensitive fields", async () => {
    mockDocs.set("ins-1", {
      userId: "u1",
      name: "Term Life",
      insurer: "LIC",
      type: "term",
      premium: "ENC(12000)",
      coverageAmount: "ENC(5000000)",
      startDate: "2024-01-01",
      frequency: "yearly",
      _encrypted: true,
    })
    const results = await getInsurancePolicies("u1")
    expect(results).toHaveLength(1)
    expect(results[0].premium).toBe(12000)
  })

  it("deleteInsurancePolicy removes doc", async () => {
    mockDocs.set("ins-1", {
      userId: "u1",
      name: "Term Life",
      insurer: "LIC",
      type: "term",
      premium: "ENC(12000)",
      coverageAmount: "ENC(5000000)",
      startDate: "2024-01-01",
      frequency: "yearly",
      _encrypted: true,
    })
    await deleteInsurancePolicy("ins-1")
    expect(mockDocs.size).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Credit Cards
// ---------------------------------------------------------------------------
describe("Firestore — Credit Cards", () => {
  beforeEach(() => {
    mockDocs.clear()
    addDocCounter = 0
  })

  it("addCreditCard returns an id", async () => {
    const result = await addCreditCard({
      userId: "u1",
      name: "HDFC Regalia",
      bank: "HDFC",
      creditLimit: 300000,
      outstandingBalance: 50000,
    })
    expect(result).toMatch(/^auto-id-/)
  })

  it("getCreditCards decrypts sensitive fields", async () => {
    mockDocs.set("cc-1", {
      userId: "u1",
      name: "HDFC Regalia",
      bank: "HDFC",
      creditLimit: "ENC(300000)",
      outstandingBalance: "ENC(50000)",
      _encrypted: true,
    })
    const results = await getCreditCards("u1")
    expect(results).toHaveLength(1)
    expect(results[0].creditLimit).toBe(300000)
  })

  it("deleteCreditCard removes doc", async () => {
    mockDocs.set("cc-1", {
      userId: "u1",
      name: "HDFC Regalia",
      bank: "HDFC",
      creditLimit: "ENC(300000)",
      outstandingBalance: "ENC(50000)",
      _encrypted: true,
    })
    await deleteCreditCard("cc-1")
    expect(mockDocs.size).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Loans
// ---------------------------------------------------------------------------
describe("Firestore — Loans", () => {
  beforeEach(() => {
    mockDocs.clear()
    addDocCounter = 0
  })

  it("addLoan returns an id", async () => {
    const result = await addLoan({
      userId: "u1",
      name: "Home Loan",
      lender: "SBI",
      type: "home",
      principalAmount: 3000000,
      outstandingAmount: 2500000,
      interestRate: 8.5,
      emiAmount: 28000,
      startDate: "2022-01-01",
    })
    expect(result).toMatch(/^auto-id-/)
  })

  it("getLoans decrypts sensitive fields", async () => {
    mockDocs.set("loan-1", {
      userId: "u1",
      name: "Home Loan",
      lender: "SBI",
      type: "home",
      principalAmount: "ENC(3000000)",
      outstandingAmount: "ENC(2500000)",
      interestRate: "ENC(8.5)",
      emiAmount: "ENC(28000)",
      startDate: "2022-01-01",
      _encrypted: true,
    })
    const results = await getLoans("u1")
    expect(results).toHaveLength(1)
    expect(results[0].emiAmount).toBe(28000)
  })

  it("deleteLoan removes doc", async () => {
    mockDocs.set("loan-1", {
      userId: "u1",
      name: "Home Loan",
      lender: "SBI",
      type: "home",
      principalAmount: "ENC(3000000)",
      outstandingAmount: "ENC(2500000)",
      interestRate: "ENC(8.5)",
      emiAmount: "ENC(28000)",
      startDate: "2022-01-01",
      _encrypted: true,
    })
    await deleteLoan("loan-1")
    expect(mockDocs.size).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Friends (Entity)
// ---------------------------------------------------------------------------
describe("Firestore — Friends (Entity)", () => {
  beforeEach(() => {
    mockDocs.clear()
    addDocCounter = 0
  })

  it("addFriend returns an id", async () => {
    const result = await addFriend({
      userId: "u1",
      name: "Raj Kumar",
      phone: "+919876543210",
      email: "raj@example.com",
    })
    expect(result).toMatch(/^auto-id-/)
  })

  it("getFriends decrypts PII", async () => {
    mockDocs.set("friend-1", {
      userId: "u1",
      name: "ENC(\"Raj Kumar\")",
      phone: "ENC(\"+919876543210\")",
      email: "ENC(\"raj@example.com\")",
      _encrypted: true,
    })
    const results = await getFriends("u1")
    expect(results).toHaveLength(1)
    expect(results[0].name).toBe("Raj Kumar")
  })

  it("deleteFriend removes doc", async () => {
    mockDocs.set("friend-1", {
      userId: "u1",
      name: "ENC(\"Raj Kumar\")",
      phone: "ENC(\"+919876543210\")",
      email: "ENC(\"raj@example.com\")",
      _encrypted: true,
    })
    await deleteFriend("friend-1")
    expect(mockDocs.size).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Family Members (Entity)
// ---------------------------------------------------------------------------
describe("Firestore — Family Members (Entity)", () => {
  beforeEach(() => {
    mockDocs.clear()
    addDocCounter = 0
  })

  it("addFamilyMember returns an id", async () => {
    const result = await addFamilyMember({
      userId: "u1",
      name: "Priya Sharma",
      relationship: "wife",
      phone: "+911234567890",
      email: "priya@home.com",
    })
    expect(result).toMatch(/^auto-id-/)
  })

  it("getFamilyMembers decrypts PII", async () => {
    mockDocs.set("fm-1", {
      userId: "u1",
      name: "ENC(\"Priya Sharma\")",
      relationship: "wife",
      phone: "ENC(\"+911234567890\")",
      email: "ENC(\"priya@home.com\")",
      _encrypted: true,
    })
    const results = await getFamilyMembers("u1")
    expect(results).toHaveLength(1)
    expect(results[0].name).toBe("Priya Sharma")
  })

  it("deleteFamilyMember removes doc", async () => {
    mockDocs.set("fm-1", {
      userId: "u1",
      name: "ENC(\"Priya Sharma\")",
      relationship: "wife",
      phone: "ENC(\"+911234567890\")",
      email: "ENC(\"priya@home.com\")",
      _encrypted: true,
    })
    await deleteFamilyMember("fm-1")
    expect(mockDocs.size).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Friends Ledger
// ---------------------------------------------------------------------------
describe("Firestore — Friends Ledger", () => {
  beforeEach(() => {
    mockDocs.clear()
    addDocCounter = 0
  })

  it("addFriendsLedgerEntry returns an id", async () => {
    const result = await addFriendsLedgerEntry({
      userId: "u1",
      friendId: "f1",
      friendName: "Raj",
      type: "lent",
      amount: 5000,
      description: "Lunch split",
      date: "2026-03-01",
      settled: false,
    })
    expect(result).toMatch(/^auto-id-/)
  })

  it("getFriendsLedger decrypts sensitive fields", async () => {
    mockDocs.set("fl-1", {
      userId: "u1",
      friendId: "f1",
      friendName: "Raj",
      type: "lent",
      amount: "ENC(5000)",
      description: "ENC(\"Lunch split\")",
      date: "2026-03-01",
      settled: false,
      _encrypted: true,
    })
    const results = await getFriendsLedger("u1")
    expect(results).toHaveLength(1)
    expect(results[0].amount).toBe(5000)
  })

  it("deleteFriendsLedgerEntry removes doc", async () => {
    mockDocs.set("fl-1", {
      userId: "u1",
      friendId: "f1",
      friendName: "Raj",
      type: "lent",
      amount: "ENC(5000)",
      description: "ENC(\"Lunch split\")",
      date: "2026-03-01",
      settled: false,
      _encrypted: true,
    })
    await deleteFriendsLedgerEntry("fl-1")
    expect(mockDocs.size).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Family Ledger
// ---------------------------------------------------------------------------
describe("Firestore — Family Ledger", () => {
  beforeEach(() => {
    mockDocs.clear()
    addDocCounter = 0
  })

  it("addFamilyLedgerEntry returns an id", async () => {
    const result = await addFamilyLedgerEntry({
      userId: "u1",
      familyMemberId: "fm1",
      familyMemberName: "Priya",
      type: "shared",
      amount: 20000,
      description: "Grocery shopping",
      date: "2026-03-01",
      settled: false,
    })
    expect(result).toMatch(/^auto-id-/)
  })

  it("getFamilyLedger decrypts sensitive fields", async () => {
    mockDocs.set("fl-1", {
      userId: "u1",
      familyMemberId: "fm1",
      familyMemberName: "Priya",
      type: "shared",
      amount: "ENC(20000)",
      description: "ENC(\"Grocery shopping\")",
      date: "2026-03-01",
      settled: false,
      _encrypted: true,
    })
    const results = await getFamilyLedger("u1")
    expect(results).toHaveLength(1)
    expect(results[0].amount).toBe(20000)
  })

  it("deleteFamilyLedgerEntry removes doc", async () => {
    mockDocs.set("fl-1", {
      userId: "u1",
      familyMemberId: "fm1",
      familyMemberName: "Priya",
      type: "shared",
      amount: "ENC(20000)",
      description: "ENC(\"Grocery shopping\")",
      date: "2026-03-01",
      settled: false,
      _encrypted: true,
    })
    await deleteFamilyLedgerEntry("fl-1")
    expect(mockDocs.size).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Properties
// ---------------------------------------------------------------------------
describe("Firestore — Properties", () => {
  beforeEach(() => {
    mockDocs.clear()
    addDocCounter = 0
  })

  it("addProperty returns an id", async () => {
    const result = await addProperty({
      userId: "u1",
      name: "2BHK Mumbai",
      type: "owned",
      category: "residential",
    })
    expect(result).toMatch(/^auto-id-/)
  })

  it("getProperties decrypts sensitive fields", async () => {
    mockDocs.set("prop-1", {
      userId: "u1",
      name: "2BHK Mumbai",
      type: "owned",
      category: "residential",
      address: "ENC(\"123 Main St\")",
      currentValue: "ENC(8000000)",
      _encrypted: true,
    })
    const results = await getProperties("u1")
    expect(results).toHaveLength(1)
    expect(results[0].currentValue).toBe(8000000)
  })

  it("deleteProperty removes doc", async () => {
    mockDocs.set("prop-1", {
      userId: "u1",
      name: "2BHK Mumbai",
      type: "owned",
      category: "residential",
      address: "ENC(\"123 Main St\")",
      currentValue: "ENC(8000000)",
      _encrypted: true,
    })
    await deleteProperty("prop-1")
    expect(mockDocs.size).toBe(0)
  })
})

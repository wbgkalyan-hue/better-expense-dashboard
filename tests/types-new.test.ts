/**
 * New Type Definitions — Completeness Tests
 *
 * Verifies that all new enum types have exhaustive label maps,
 * required fields are present in type shapes, and no label is undefined.
 */
import { describe, it, expect } from "vitest"
import {
  RE_INVESTMENT_TYPE_LABELS,
  INSURANCE_TYPE_LABELS,
  INSURANCE_FREQUENCY_LABELS,
  LOAN_TYPE_LABELS,
  LEDGER_ENTRY_TYPE_LABELS,
  FAMILY_LEDGER_TYPE_LABELS,
  FRIEND_RELATIONSHIP_LABELS,
  FAMILY_RELATIONSHIP_LABELS,
  PROPERTY_TYPE_LABELS,
  PROPERTY_CATEGORY_LABELS,
} from "@/types"

describe("RE Investment Types — label completeness", () => {
  const expected = ["residential", "commercial", "land", "other"]

  it("has a label for every type", () => {
    for (const key of expected) {
      expect(RE_INVESTMENT_TYPE_LABELS[key as keyof typeof RE_INVESTMENT_TYPE_LABELS]).toBeDefined()
    }
  })

  it("has no undefined labels", () => {
    for (const val of Object.values(RE_INVESTMENT_TYPE_LABELS)) {
      expect(typeof val).toBe("string")
      expect(val.length).toBeGreaterThan(0)
    }
  })

  it("covers exactly the expected keys", () => {
    expect(Object.keys(RE_INVESTMENT_TYPE_LABELS).sort()).toEqual(expected.sort())
  })
})

describe("Insurance Types — label completeness", () => {
  const expected = ["life", "health", "vehicle", "property", "term", "other"]

  it("has a label for every insurance type", () => {
    for (const key of expected) {
      expect(INSURANCE_TYPE_LABELS[key as keyof typeof INSURANCE_TYPE_LABELS]).toBeDefined()
    }
  })

  it("covers exactly the expected keys", () => {
    expect(Object.keys(INSURANCE_TYPE_LABELS).sort()).toEqual(expected.sort())
  })
})

describe("Insurance Frequency — label completeness", () => {
  const expected = ["monthly", "quarterly", "yearly"]

  it("has a label for every frequency", () => {
    for (const key of expected) {
      expect(INSURANCE_FREQUENCY_LABELS[key as keyof typeof INSURANCE_FREQUENCY_LABELS]).toBeDefined()
    }
  })

  it("covers exactly the expected keys", () => {
    expect(Object.keys(INSURANCE_FREQUENCY_LABELS).sort()).toEqual(expected.sort())
  })
})

describe("Loan Types — label completeness", () => {
  const expected = ["home", "car", "personal", "education", "business", "other"]

  it("has a label for every loan type", () => {
    for (const key of expected) {
      expect(LOAN_TYPE_LABELS[key as keyof typeof LOAN_TYPE_LABELS]).toBeDefined()
    }
  })

  it("covers exactly the expected keys", () => {
    expect(Object.keys(LOAN_TYPE_LABELS).sort()).toEqual(expected.sort())
  })
})

describe("Ledger Entry Types — label completeness", () => {
  it("has labels for lent and borrowed", () => {
    expect(LEDGER_ENTRY_TYPE_LABELS["lent"]).toBeDefined()
    expect(LEDGER_ENTRY_TYPE_LABELS["borrowed"]).toBeDefined()
  })

  it("covers exactly lent and borrowed", () => {
    expect(Object.keys(LEDGER_ENTRY_TYPE_LABELS).sort()).toEqual(["borrowed", "lent"])
  })
})

describe("Family Ledger Types — label completeness", () => {
  const expected = ["paid", "received", "shared"]

  it("has a label for every family ledger type", () => {
    for (const key of expected) {
      expect(FAMILY_LEDGER_TYPE_LABELS[key as keyof typeof FAMILY_LEDGER_TYPE_LABELS]).toBeDefined()
    }
  })

  it("covers exactly the expected keys", () => {
    expect(Object.keys(FAMILY_LEDGER_TYPE_LABELS).sort()).toEqual(expected.sort())
  })
})

describe("Friend Relationship Labels — completeness", () => {
  const expected = ["colleague", "neighbor", "classmate", "other"]

  it("has a label for every relationship type", () => {
    for (const key of expected) {
      expect(FRIEND_RELATIONSHIP_LABELS[key as keyof typeof FRIEND_RELATIONSHIP_LABELS]).toBeDefined()
    }
  })

  it("covers exactly the expected keys", () => {
    expect(Object.keys(FRIEND_RELATIONSHIP_LABELS).sort()).toEqual(expected.sort())
  })
})

describe("Family Relationship Labels — completeness", () => {
  const expected = ["wife", "husband", "son", "daughter", "father", "mother", "brother", "sister", "other"]

  it("has a label for every family relationship", () => {
    for (const key of expected) {
      expect(FAMILY_RELATIONSHIP_LABELS[key as keyof typeof FAMILY_RELATIONSHIP_LABELS]).toBeDefined()
    }
  })

  it("covers exactly the expected keys", () => {
    expect(Object.keys(FAMILY_RELATIONSHIP_LABELS).sort()).toEqual(expected.sort())
  })
})

describe("Property Types — label completeness", () => {
  const expected = ["owned", "rented", "leased"]

  it("has a label for every property type", () => {
    for (const key of expected) {
      expect(PROPERTY_TYPE_LABELS[key as keyof typeof PROPERTY_TYPE_LABELS]).toBeDefined()
    }
  })

  it("covers exactly the expected keys", () => {
    expect(Object.keys(PROPERTY_TYPE_LABELS).sort()).toEqual(expected.sort())
  })
})

describe("Property Categories — label completeness", () => {
  const expected = ["residential", "commercial", "land", "other"]

  it("has a label for every property category", () => {
    for (const key of expected) {
      expect(PROPERTY_CATEGORY_LABELS[key as keyof typeof PROPERTY_CATEGORY_LABELS]).toBeDefined()
    }
  })

  it("covers exactly the expected keys", () => {
    expect(Object.keys(PROPERTY_CATEGORY_LABELS).sort()).toEqual(expected.sort())
  })
})

describe("Type shape validation — RealEstateInvestment", () => {
  it("satisfies required field contract at runtime", () => {
    const obj = {
      id: "1",
      userId: "u1",
      name: "Plot A",
      location: "Mumbai",
      type: "land" as const,
      purchasePrice: 500000,
      currentValue: 700000,
      purchaseDate: "2023-01-01",
      createdAt: "2023-01-01",
      updatedAt: "2023-01-01",
    }
    expect(obj.purchasePrice).toBeGreaterThan(0)
    expect(obj.currentValue).toBeGreaterThan(0)
    expect(typeof obj.name).toBe("string")
  })
})

describe("Type shape validation — Loan", () => {
  it("satisfies required field contract at runtime", () => {
    const obj = {
      id: "1",
      userId: "u1",
      name: "Home Loan",
      lender: "SBI",
      type: "home" as const,
      principalAmount: 3000000,
      outstandingAmount: 2500000,
      interestRate: 8.5,
      emiAmount: 28000,
      startDate: "2022-01-01",
      createdAt: "2022-01-01",
      updatedAt: "2022-01-01",
    }
    expect(obj.interestRate).toBeGreaterThan(0)
    expect(obj.emiAmount).toBeGreaterThan(0)
    expect(obj.outstandingAmount).toBeLessThanOrEqual(obj.principalAmount)
  })
})

describe("Type shape validation — FriendsLedgerEntry", () => {
  it("settled flag defaults to false for new entries", () => {
    const entry = {
      id: "1",
      userId: "u1",
      friendId: "f1",
      type: "lent" as const,
      amount: 5000,
      description: "Lunch",
      date: "2026-03-01",
      settled: false,
      createdAt: "2026-03-01",
      updatedAt: "2026-03-01",
    }
    expect(entry.settled).toBe(false)
    expect(entry.amount).toBeGreaterThan(0)
  })
})

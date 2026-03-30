/**
 * Dashboard Type & Category Tests
 *
 * Validates enum completeness, label coverage, and type structure.
 */
import { describe, it, expect } from "vitest"
import {
  ExpenseCategory,
  IncomeCategory,
  GoalType,
  BankAccountType,
  AssetType,
  EXPENSE_CATEGORY_LABELS,
  INCOME_CATEGORY_LABELS,
  GOAL_TYPE_LABELS,
  BANK_ACCOUNT_TYPE_LABELS,
  ASSET_TYPE_LABELS,
} from "@/types/categories"

describe("Categories — Enum Completeness", () => {
  it("ExpenseCategory has 13 values", () => {
    const values = Object.values(ExpenseCategory)
    expect(values.length).toBe(13)
  })

  it("IncomeCategory has 8 values", () => {
    const values = Object.values(IncomeCategory)
    expect(values.length).toBe(8)
  })

  it("GoalType has 6 values", () => {
    const values = Object.values(GoalType)
    expect(values.length).toBe(6)
  })

  it("BankAccountType has 5 values", () => {
    const values = Object.values(BankAccountType)
    expect(values.length).toBe(5)
  })

  it("AssetType has 5 values", () => {
    const values = Object.values(AssetType)
    expect(values.length).toBe(5)
  })
})

describe("Categories — Labels Cover Every Enum Value", () => {
  it("every ExpenseCategory has a label", () => {
    for (const cat of Object.values(ExpenseCategory)) {
      expect(EXPENSE_CATEGORY_LABELS[cat]).toBeDefined()
      expect(typeof EXPENSE_CATEGORY_LABELS[cat]).toBe("string")
      expect(EXPENSE_CATEGORY_LABELS[cat].length).toBeGreaterThan(0)
    }
  })

  it("every IncomeCategory has a label", () => {
    for (const cat of Object.values(IncomeCategory)) {
      expect(INCOME_CATEGORY_LABELS[cat]).toBeDefined()
      expect(typeof INCOME_CATEGORY_LABELS[cat]).toBe("string")
    }
  })

  it("every GoalType has a label", () => {
    for (const g of Object.values(GoalType)) {
      expect(GOAL_TYPE_LABELS[g]).toBeDefined()
      expect(typeof GOAL_TYPE_LABELS[g]).toBe("string")
    }
  })

  it("every BankAccountType has a label", () => {
    for (const b of Object.values(BankAccountType)) {
      expect(BANK_ACCOUNT_TYPE_LABELS[b]).toBeDefined()
    }
  })

  it("every AssetType has a label", () => {
    for (const a of Object.values(AssetType)) {
      expect(ASSET_TYPE_LABELS[a]).toBeDefined()
    }
  })
})

describe("Categories — No Extra Labels Without Enum Values", () => {
  it("EXPENSE_CATEGORY_LABELS keys match ExpenseCategory enum", () => {
    const enumValues = new Set(Object.values(ExpenseCategory))
    const labelKeys = Object.keys(EXPENSE_CATEGORY_LABELS)
    for (const key of labelKeys) {
      expect(enumValues.has(key as ExpenseCategory)).toBe(true)
    }
  })

  it("INCOME_CATEGORY_LABELS keys match IncomeCategory enum", () => {
    const enumValues = new Set(Object.values(IncomeCategory))
    const labelKeys = Object.keys(INCOME_CATEGORY_LABELS)
    for (const key of labelKeys) {
      expect(enumValues.has(key as IncomeCategory)).toBe(true)
    }
  })
})

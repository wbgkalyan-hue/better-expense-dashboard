import { ExpenseCategory, IncomeCategory } from "./categories"

export type TransactionType = "expense" | "income"
export type TransactionSource = "manual" | "auto"

export interface Transaction {
  id: string
  userId: string
  amount: number
  type: TransactionType
  category: ExpenseCategory | IncomeCategory | (string & {})
  description: string
  merchant?: string
  date: string // ISO 8601
  source: TransactionSource
  rawNotification?: string
  createdAt: string
  updatedAt: string
}

export interface TransactionFilters {
  type?: TransactionType
  category?: ExpenseCategory | IncomeCategory | (string & {})
  startDate?: string
  endDate?: string
  minAmount?: number
  maxAmount?: number
  search?: string
}

export interface MonthlyStats {
  month: string // YYYY-MM
  totalExpenses: number
  totalIncome: number
  net: number
  byCategory: Record<string, number>
}

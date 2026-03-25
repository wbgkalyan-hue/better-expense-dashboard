import { BankAccountType } from "./categories"

export interface BankAccount {
  id: string
  userId: string
  name: string
  bankName: string
  type: BankAccountType
  balance: number
  interestRate?: number
  maturityDate?: string // for FD/RD
  createdAt: string
  updatedAt: string
}

/**
 * A credit card tracked by the user.
 * Financial fields (`last4`, `creditLimit`, `outstandingBalance`,
 * `minPayment`, `interestRate`) are encrypted at rest in Firestore.
 */
export type CreditCard = {
  id: string
  userId: string
  /** Card nickname (e.g. "HDFC Millennia"). */
  name: string
  /** Issuing bank name. */
  bank: string
  /** Last 4 digits of the card number (encrypted). */
  last4?: string
  /** Total approved credit limit (encrypted). */
  creditLimit: number
  /** Current amount owed on the card (encrypted). */
  outstandingBalance: number
  /** Minimum payment due this billing cycle (encrypted). */
  minPayment?: number
  /** ISO-8601 date the payment is due. */
  dueDate?: string
  /** Annual interest / APR percentage (encrypted). */
  interestRate?: number
  notes?: string
  createdAt: string
  updatedAt: string
}

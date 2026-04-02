/** Category of loan. */
export type LoanType = "home" | "car" | "personal" | "education" | "business" | "other"

/** Human-readable labels for {@link LoanType}. */
export const LOAN_TYPE_LABELS: Record<LoanType, string> = {
  home: "Home Loan",
  car: "Car Loan",
  personal: "Personal Loan",
  education: "Education Loan",
  business: "Business Loan",
  other: "Other",
}

/**
 * A loan or EMI obligation tracked by the user.
 * Financial fields (`principalAmount`, `outstandingAmount`,
 * `interestRate`, `emiAmount`) are encrypted at rest in Firestore.
 */
export type Loan = {
  id: string
  userId: string
  /** Friendly loan label (e.g. "Home Loan – SBI"). */
  name: string
  /** Bank or NBFC that issued the loan. */
  lender: string
  type: LoanType
  /** Original sanctioned principal (encrypted). */
  principalAmount: number
  /** Remaining outstanding balance (encrypted). */
  outstandingAmount: number
  /** Annual interest rate as a percentage, e.g. 8.5 (encrypted). */
  interestRate: number
  /** Monthly EMI instalment amount (encrypted). */
  emiAmount: number
  /** ISO-8601 date the loan was disbursed. */
  startDate: string
  /** ISO-8601 expected loan closure date. */
  endDate?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

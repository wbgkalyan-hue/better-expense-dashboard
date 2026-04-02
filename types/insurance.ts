/** Category of insurance policy. */
export type InsuranceType = "life" | "health" | "vehicle" | "property" | "term" | "other"

/** Human-readable labels for {@link InsuranceType}. */
export const INSURANCE_TYPE_LABELS: Record<InsuranceType, string> = {
  life: "Life",
  health: "Health",
  vehicle: "Vehicle",
  property: "Property",
  term: "Term",
  other: "Other",
}

/** How often the insurance premium is paid. */
export type InsuranceFrequency = "monthly" | "quarterly" | "yearly"

/** Human-readable labels for {@link InsuranceFrequency}. */
export const INSURANCE_FREQUENCY_LABELS: Record<InsuranceFrequency, string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
}

/**
 * An insurance policy held by the user.
 * Sensitive fields (`policyNumber`, `premium`, `coverageAmount`) are
 * encrypted at rest in Firestore.
 */
export type InsurancePolicy = {
  id: string
  userId: string
  /** Friendly policy name (e.g. "Family Health Cover"). */
  name: string
  /** Name of the insurance company / provider. */
  insurer: string
  type: InsuranceType
  /** Policy number as printed on the certificate (encrypted). */
  policyNumber?: string
  /** Premium amount per {@link frequency} period (encrypted). */
  premium: number
  /** Total sum insured / coverage amount (encrypted). */
  coverageAmount: number
  /** ISO-8601 policy start date. */
  startDate: string
  /** ISO-8601 policy expiry date (omit for whole-life policies). */
  endDate?: string
  frequency: InsuranceFrequency
  notes?: string
  createdAt: string
  updatedAt: string
}

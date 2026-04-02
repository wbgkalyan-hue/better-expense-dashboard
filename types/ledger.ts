/** Direction of a friends ledger entry from the user's perspective. */
export type LedgerEntryType = "lent" | "borrowed"

/** Human-readable labels for {@link LedgerEntryType}. */
export const LEDGER_ENTRY_TYPE_LABELS: Record<LedgerEntryType, string> = {
  lent: "Lent",
  borrowed: "Borrowed",
}

/**
 * A money-exchange record between the user and a {@link Friend}.
 * Financial fields (`amount`, `description`) are encrypted at rest in Firestore.
 */
export type FriendsLedgerEntry = {
  id: string
  userId: string
  /** FK → `friends` collection. */
  friendId: string
  /** Denormalised display name (encrypted alongside the friend entity). */
  friendName?: string
  type: LedgerEntryType
  /** Amount exchanged (encrypted). */
  amount: number
  /** Short description of the transaction (encrypted). */
  description: string
  /** ISO-8601 date the exchange occurred. */
  date: string
  /** Whether the debt has been settled. */
  settled: boolean
  /** ISO-8601 date the debt was settled. */
  settledDate?: string
  createdAt: string
  updatedAt: string
}

/** Direction of a partners ledger entry from the user's perspective. */
export type PartnerLedgerType = "paid" | "received" | "shared"

/** Human-readable labels for {@link PartnerLedgerType}. */
export const PARTNER_LEDGER_TYPE_LABELS: Record<PartnerLedgerType, string> = {
  paid: "Paid",
  received: "Received",
  shared: "Shared",
}

/**
 * A money-exchange record between the user and a {@link Partner}.
 * Financial fields (`amount`, `description`) are encrypted at rest in Firestore.
 */
export type PartnersLedgerEntry = {
  id: string
  userId: string
  /** FK → `partners` collection. */
  partnerId: string
  /** Denormalised display name (encrypted alongside the partner entity). */
  partnerName?: string
  type: PartnerLedgerType
  /** Amount exchanged (encrypted). */
  amount: number
  /** Short description of the transaction (encrypted). */
  description: string
  /** ISO-8601 date the exchange occurred. */
  date: string
  /** Whether the debt / share has been settled. */
  settled: boolean
  /** ISO-8601 date the entry was settled. */
  settledDate?: string
  createdAt: string
  updatedAt: string
}

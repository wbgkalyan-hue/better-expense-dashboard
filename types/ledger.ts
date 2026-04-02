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

/** Direction of a family ledger entry from the user's perspective. */
export type FamilyLedgerType = "paid" | "received" | "shared"

/** Human-readable labels for {@link FamilyLedgerType}. */
export const FAMILY_LEDGER_TYPE_LABELS: Record<FamilyLedgerType, string> = {
  paid: "Paid",
  received: "Received",
  shared: "Shared",
}

/**
 * A money-exchange record between the user and a {@link FamilyMember}.
 * Financial fields (`amount`, `description`) are encrypted at rest in Firestore.
 */
export type FamilyLedgerEntry = {
  id: string
  userId: string
  /** FK → `family_members` collection. */
  familyMemberId: string
  /** Denormalised display name (encrypted alongside the family member entity). */
  familyMemberName?: string
  type: FamilyLedgerType
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

/**
 * A friend contact stored in the user's address book.
 * PII fields (`name`, `phone`, `email`) are encrypted at rest in Firestore.
 */
export type Friend = {
  id: string
  userId: string
  /** Full name of the friend (encrypted). */
  name: string
  /** Mobile / phone number (encrypted). */
  phone?: string
  /** Email address (encrypted). */
  email?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

/**
 * A business partner contact stored in the user's address book.
 * PII fields (`name`, `company`, `phone`, `email`) are encrypted at rest in Firestore.
 */
export type Partner = {
  id: string
  userId: string
  /** Full name of the partner (encrypted). */
  name: string
  /** Company or organisation they belong to (encrypted). */
  company?: string
  /** Mobile / phone number (encrypted). */
  phone?: string
  /** Email address (encrypted). */
  email?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

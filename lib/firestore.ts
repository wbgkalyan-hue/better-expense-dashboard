import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  type DocumentData,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { encryptField, decryptField, isEncryptionReady } from "@/lib/encryption"
import type {
  Transaction,
  BrokerAccount,
  InvestmentTransaction,
  Goal,
  NetworthSnapshot,
  BankAccount,
  Asset,
} from "@/types"

// ---------------------------------------------------------------------------
// Sensitive field definitions per collection
// ---------------------------------------------------------------------------

const TRANSACTION_SENSITIVE = ["amount", "description", "merchant", "rawNotification"]
const BROKER_SENSITIVE = ["currentValue", "totalInvested", "returns", "returnsPercent"]
const INVESTMENT_TX_SENSITIVE = ["amount", "note", "rawNotification"]
const GOAL_SENSITIVE = ["targetAmount", "currentAmount", "description"]
const BANK_SENSITIVE = ["balance", "interestRate"]
const ASSET_SENSITIVE = ["currentValue", "purchaseValue", "description"]
const NETWORTH_SENSITIVE = [
  "totalBank", "totalInvestments", "totalAssets", "totalDebts", "networth", "liquidFunds",
]

// ---------------------------------------------------------------------------
// Generic encrypt / decrypt helpers
// ---------------------------------------------------------------------------

async function encryptDoc(
  data: Record<string, unknown>,
  sensitiveFields: string[],
): Promise<Record<string, unknown>> {
  if (!isEncryptionReady()) return data
  const result: Record<string, unknown> = { _encrypted: true }
  for (const [key, value] of Object.entries(data)) {
    if (sensitiveFields.includes(key) && value != null) {
      result[key] = await encryptField(value)
    } else {
      result[key] = value
    }
  }
  return result
}

async function decryptDoc<T>(
  raw: Record<string, unknown>,
  sensitiveFields: string[],
): Promise<T | null> {
  if (raw._encrypted) {
    if (!isEncryptionReady()) return null // can't decrypt yet
    const result = { ...raw }
    for (const field of sensitiveFields) {
      if (result[field] && typeof result[field] === "string") {
        try {
          result[field] = await decryptField(result[field] as string)
        } catch {
          return null // corrupt / wrong key
        }
      }
    }
    delete result._encrypted
    return result as T
  }
  return raw as T
}

// ---------------------------------------------------------------------------
// Transactions
// ---------------------------------------------------------------------------

export async function getTransactions(userId: string): Promise<Transaction[]> {
  const q = query(
    collection(db, "transactions"),
    where("userId", "==", userId),
  )
  const snapshot = await getDocs(q)
  const results = await Promise.all(
    snapshot.docs.map(async (snap) => {
      const raw = { id: snap.id, ...snap.data() }
      return decryptDoc<Transaction>(raw, TRANSACTION_SENSITIVE)
    }),
  )
  return results
    .filter((r): r is Transaction => r !== null)
    .sort((a, b) => b.date.localeCompare(a.date))
}

export async function addTransaction(
  data: Omit<Transaction, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  const payload = await encryptDoc(
    { ...data },
    TRANSACTION_SENSITIVE,
  )
  payload.createdAt = serverTimestamp()
  payload.updatedAt = serverTimestamp()
  const ref = await addDoc(collection(db, "transactions"), payload)
  return ref.id
}

export async function updateTransaction(
  id: string,
  data: Partial<Transaction>,
): Promise<void> {
  const payload = await encryptDoc(
    { ...data },
    TRANSACTION_SENSITIVE,
  )
  payload.updatedAt = serverTimestamp()
  if (isEncryptionReady()) payload._encrypted = true
  await updateDoc(doc(db, "transactions", id), payload)
}

export async function deleteTransaction(id: string): Promise<void> {
  await deleteDoc(doc(db, "transactions", id))
}

// ---------------------------------------------------------------------------
// Broker Accounts
// ---------------------------------------------------------------------------

export async function getBrokerAccounts(
  userId: string,
): Promise<BrokerAccount[]> {
  const q = query(
    collection(db, "broker_accounts"),
    where("userId", "==", userId),
  )
  const snapshot = await getDocs(q)
  const results = await Promise.all(
    snapshot.docs.map(async (snap) => {
      const raw = { id: snap.id, ...snap.data() }
      return decryptDoc<BrokerAccount>(raw, BROKER_SENSITIVE)
    }),
  )
  return results
    .filter((r): r is BrokerAccount => r !== null)
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
}

export async function addBrokerAccount(
  data: Omit<BrokerAccount, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  const payload = await encryptDoc({ ...data }, BROKER_SENSITIVE)
  payload.createdAt = serverTimestamp()
  payload.updatedAt = serverTimestamp()
  const ref = await addDoc(collection(db, "broker_accounts"), payload)
  return ref.id
}

export async function getBrokerAccount(
  id: string,
): Promise<BrokerAccount | null> {
  const snap = await getDoc(doc(db, "broker_accounts", id))
  if (!snap.exists()) return null
  const raw = { id: snap.id, ...snap.data() }
  return decryptDoc<BrokerAccount>(raw, BROKER_SENSITIVE)
}

// ---------------------------------------------------------------------------
// Investment Transactions
// ---------------------------------------------------------------------------

export async function getInvestmentTransactions(
  userId: string,
  brokerAccountId?: string,
): Promise<InvestmentTransaction[]> {
  const constraints = [where("userId", "==", userId)]
  if (brokerAccountId) {
    constraints.push(where("brokerAccountId", "==", brokerAccountId))
  }
  const q = query(collection(db, "investment_transactions"), ...constraints)
  const snapshot = await getDocs(q)
  const results = await Promise.all(
    snapshot.docs.map(async (snap) => {
      const raw = { id: snap.id, ...snap.data() }
      return decryptDoc<InvestmentTransaction>(raw, INVESTMENT_TX_SENSITIVE)
    }),
  )
  return results
    .filter((r): r is InvestmentTransaction => r !== null)
    .sort((a, b) => b.date.localeCompare(a.date))
}

export async function addInvestmentTransaction(
  data: Omit<InvestmentTransaction, "id" | "createdAt">,
): Promise<string> {
  const payload = await encryptDoc({ ...data }, INVESTMENT_TX_SENSITIVE)
  payload.createdAt = serverTimestamp()
  const ref = await addDoc(collection(db, "investment_transactions"), payload)
  return ref.id
}

// ---------------------------------------------------------------------------
// Goals
// ---------------------------------------------------------------------------

export async function getGoals(userId: string): Promise<Goal[]> {
  const q = query(
    collection(db, "goals"),
    where("userId", "==", userId),
  )
  const snapshot = await getDocs(q)
  const results = await Promise.all(
    snapshot.docs.map(async (snap) => {
      const raw = { id: snap.id, ...snap.data() }
      return decryptDoc<Goal>(raw, GOAL_SENSITIVE)
    }),
  )
  return results
    .filter((r): r is Goal => r !== null)
    .sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99))
}

export async function addGoal(
  data: Omit<Goal, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  const payload = await encryptDoc({ ...data }, GOAL_SENSITIVE)
  payload.createdAt = serverTimestamp()
  payload.updatedAt = serverTimestamp()
  const ref = await addDoc(collection(db, "goals"), payload)
  return ref.id
}

export async function updateGoal(
  id: string,
  data: Partial<Goal>,
): Promise<void> {
  const payload = await encryptDoc({ ...data }, GOAL_SENSITIVE)
  payload.updatedAt = serverTimestamp()
  if (isEncryptionReady()) payload._encrypted = true
  await updateDoc(doc(db, "goals", id), payload)
}

export async function deleteGoal(id: string): Promise<void> {
  await deleteDoc(doc(db, "goals", id))
}

// ---------------------------------------------------------------------------
// Bank Accounts
// ---------------------------------------------------------------------------

export async function getBankAccounts(
  userId: string,
): Promise<BankAccount[]> {
  const q = query(
    collection(db, "bank_accounts"),
    where("userId", "==", userId),
  )
  const snapshot = await getDocs(q)
  const results = await Promise.all(
    snapshot.docs.map(async (snap) => {
      const raw = { id: snap.id, ...snap.data() }
      return decryptDoc<BankAccount>(raw, BANK_SENSITIVE)
    }),
  )
  return results.filter((r): r is BankAccount => r !== null)
}

export async function addBankAccount(
  data: Omit<BankAccount, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  const payload = await encryptDoc({ ...data }, BANK_SENSITIVE)
  payload.createdAt = serverTimestamp()
  payload.updatedAt = serverTimestamp()
  const ref = await addDoc(collection(db, "bank_accounts"), payload)
  return ref.id
}

export async function updateBankAccount(
  id: string,
  data: Partial<BankAccount>,
): Promise<void> {
  const payload = await encryptDoc({ ...data }, BANK_SENSITIVE)
  payload.updatedAt = serverTimestamp()
  if (isEncryptionReady()) payload._encrypted = true
  await updateDoc(doc(db, "bank_accounts", id), payload)
}

export async function deleteBankAccount(id: string): Promise<void> {
  await deleteDoc(doc(db, "bank_accounts", id))
}

// ---------------------------------------------------------------------------
// Assets
// ---------------------------------------------------------------------------

export async function getAssets(userId: string): Promise<Asset[]> {
  const q = query(
    collection(db, "assets"),
    where("userId", "==", userId),
  )
  const snapshot = await getDocs(q)
  const results = await Promise.all(
    snapshot.docs.map(async (snap) => {
      const raw = { id: snap.id, ...snap.data() }
      return decryptDoc<Asset>(raw, ASSET_SENSITIVE)
    }),
  )
  return results.filter((r): r is Asset => r !== null)
}

export async function addAsset(
  data: Omit<Asset, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  const payload = await encryptDoc({ ...data }, ASSET_SENSITIVE)
  payload.createdAt = serverTimestamp()
  payload.updatedAt = serverTimestamp()
  const ref = await addDoc(collection(db, "assets"), payload)
  return ref.id
}

export async function updateAsset(
  id: string,
  data: Partial<Asset>,
): Promise<void> {
  const payload = await encryptDoc({ ...data }, ASSET_SENSITIVE)
  payload.updatedAt = serverTimestamp()
  if (isEncryptionReady()) payload._encrypted = true
  await updateDoc(doc(db, "assets", id), payload)
}

export async function deleteAsset(id: string): Promise<void> {
  await deleteDoc(doc(db, "assets", id))
}

// ---------------------------------------------------------------------------
// Networth Snapshots
// ---------------------------------------------------------------------------

export async function getNetworthSnapshots(
  userId: string,
): Promise<NetworthSnapshot[]> {
  const q = query(
    collection(db, "networth_snapshots"),
    where("userId", "==", userId),
  )
  const snapshot = await getDocs(q)
  const results = await Promise.all(
    snapshot.docs.map(async (snap) => {
      const raw = { id: snap.id, ...snap.data() }
      return decryptDoc<NetworthSnapshot>(raw, NETWORTH_SENSITIVE)
    }),
  )
  return results
    .filter((r): r is NetworthSnapshot => r !== null)
    .sort((a, b) => b.date.localeCompare(a.date))
}

// ---------------------------------------------------------------------------
// Real Estate Investments
// ---------------------------------------------------------------------------

const RE_INVESTMENT_SENSITIVE = ["purchasePrice", "currentValue", "monthlyRent", "notes"]

export async function getRealEstateInvestments(userId: string): Promise<import("@/types").RealEstateInvestment[]> {
  const q = query(collection(db, "re_investments"), where("userId", "==", userId))
  const snapshot = await getDocs(q)
  const results = await Promise.all(
    snapshot.docs.map(async (snap) => {
      const raw = { id: snap.id, ...snap.data() }
      return decryptDoc<import("@/types").RealEstateInvestment>(raw, RE_INVESTMENT_SENSITIVE)
    }),
  )
  return results
    .filter((r): r is import("@/types").RealEstateInvestment => r !== null)
    .sort((a, b) => b.purchaseDate.localeCompare(a.purchaseDate))
}

export async function addRealEstateInvestment(
  data: Omit<import("@/types").RealEstateInvestment, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  const payload = await encryptDoc({ ...data }, RE_INVESTMENT_SENSITIVE)
  payload.createdAt = serverTimestamp()
  payload.updatedAt = serverTimestamp()
  const ref = await addDoc(collection(db, "re_investments"), payload)
  return ref.id
}

export async function updateRealEstateInvestment(
  id: string,
  data: Partial<import("@/types").RealEstateInvestment>,
): Promise<void> {
  const payload = await encryptDoc({ ...data }, RE_INVESTMENT_SENSITIVE)
  payload.updatedAt = serverTimestamp()
  if (isEncryptionReady()) payload._encrypted = true
  await updateDoc(doc(db, "re_investments", id), payload)
}

export async function deleteRealEstateInvestment(id: string): Promise<void> {
  await deleteDoc(doc(db, "re_investments", id))
}

// ---------------------------------------------------------------------------
// Insurance Policies
// ---------------------------------------------------------------------------

const INSURANCE_SENSITIVE = ["policyNumber", "premium", "coverageAmount"]

export async function getInsurancePolicies(userId: string): Promise<import("@/types").InsurancePolicy[]> {
  const q = query(collection(db, "insurance_policies"), where("userId", "==", userId))
  const snapshot = await getDocs(q)
  const results = await Promise.all(
    snapshot.docs.map(async (snap) => {
      const raw = { id: snap.id, ...snap.data() }
      return decryptDoc<import("@/types").InsurancePolicy>(raw, INSURANCE_SENSITIVE)
    }),
  )
  return results
    .filter((r): r is import("@/types").InsurancePolicy => r !== null)
    .sort((a, b) => b.startDate.localeCompare(a.startDate))
}

export async function addInsurancePolicy(
  data: Omit<import("@/types").InsurancePolicy, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  const payload = await encryptDoc({ ...data }, INSURANCE_SENSITIVE)
  payload.createdAt = serverTimestamp()
  payload.updatedAt = serverTimestamp()
  const ref = await addDoc(collection(db, "insurance_policies"), payload)
  return ref.id
}

export async function updateInsurancePolicy(
  id: string,
  data: Partial<import("@/types").InsurancePolicy>,
): Promise<void> {
  const payload = await encryptDoc({ ...data }, INSURANCE_SENSITIVE)
  payload.updatedAt = serverTimestamp()
  if (isEncryptionReady()) payload._encrypted = true
  await updateDoc(doc(db, "insurance_policies", id), payload)
}

export async function deleteInsurancePolicy(id: string): Promise<void> {
  await deleteDoc(doc(db, "insurance_policies", id))
}

// ---------------------------------------------------------------------------
// Credit Cards
// ---------------------------------------------------------------------------

const CREDIT_CARD_SENSITIVE = ["last4", "creditLimit", "outstandingBalance", "minPayment", "interestRate"]

export async function getCreditCards(userId: string): Promise<import("@/types").CreditCard[]> {
  const q = query(collection(db, "credit_cards"), where("userId", "==", userId))
  const snapshot = await getDocs(q)
  const results = await Promise.all(
    snapshot.docs.map(async (snap) => {
      const raw = { id: snap.id, ...snap.data() }
      return decryptDoc<import("@/types").CreditCard>(raw, CREDIT_CARD_SENSITIVE)
    }),
  )
  return results.filter((r): r is import("@/types").CreditCard => r !== null)
}

export async function addCreditCard(
  data: Omit<import("@/types").CreditCard, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  const payload = await encryptDoc({ ...data }, CREDIT_CARD_SENSITIVE)
  payload.createdAt = serverTimestamp()
  payload.updatedAt = serverTimestamp()
  const ref = await addDoc(collection(db, "credit_cards"), payload)
  return ref.id
}

export async function updateCreditCard(
  id: string,
  data: Partial<import("@/types").CreditCard>,
): Promise<void> {
  const payload = await encryptDoc({ ...data }, CREDIT_CARD_SENSITIVE)
  payload.updatedAt = serverTimestamp()
  if (isEncryptionReady()) payload._encrypted = true
  await updateDoc(doc(db, "credit_cards", id), payload)
}

export async function deleteCreditCard(id: string): Promise<void> {
  await deleteDoc(doc(db, "credit_cards", id))
}

// ---------------------------------------------------------------------------
// Loans
// ---------------------------------------------------------------------------

const LOAN_SENSITIVE = ["principalAmount", "outstandingAmount", "interestRate", "emiAmount"]

export async function getLoans(userId: string): Promise<import("@/types").Loan[]> {
  const q = query(collection(db, "loans"), where("userId", "==", userId))
  const snapshot = await getDocs(q)
  const results = await Promise.all(
    snapshot.docs.map(async (snap) => {
      const raw = { id: snap.id, ...snap.data() }
      return decryptDoc<import("@/types").Loan>(raw, LOAN_SENSITIVE)
    }),
  )
  return results
    .filter((r): r is import("@/types").Loan => r !== null)
    .sort((a, b) => b.startDate.localeCompare(a.startDate))
}

export async function addLoan(
  data: Omit<import("@/types").Loan, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  const payload = await encryptDoc({ ...data }, LOAN_SENSITIVE)
  payload.createdAt = serverTimestamp()
  payload.updatedAt = serverTimestamp()
  const ref = await addDoc(collection(db, "loans"), payload)
  return ref.id
}

export async function updateLoan(
  id: string,
  data: Partial<import("@/types").Loan>,
): Promise<void> {
  const payload = await encryptDoc({ ...data }, LOAN_SENSITIVE)
  payload.updatedAt = serverTimestamp()
  if (isEncryptionReady()) payload._encrypted = true
  await updateDoc(doc(db, "loans", id), payload)
}

export async function deleteLoan(id: string): Promise<void> {
  await deleteDoc(doc(db, "loans", id))
}

// ---------------------------------------------------------------------------
// Friends (Entity)
// ---------------------------------------------------------------------------

const FRIEND_SENSITIVE = ["name", "phone", "email", "address"]

export async function getFriends(userId: string): Promise<import("@/types").Friend[]> {
  const q = query(collection(db, "friends"), where("userId", "==", userId))
  const snapshot = await getDocs(q)
  const results = await Promise.all(
    snapshot.docs.map(async (snap) => {
      const raw = { id: snap.id, ...snap.data() }
      return decryptDoc<import("@/types").Friend>(raw, FRIEND_SENSITIVE)
    }),
  )
  return results.filter((r): r is import("@/types").Friend => r !== null)
}

export async function addFriend(
  data: Omit<import("@/types").Friend, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  const payload = await encryptDoc({ ...data }, FRIEND_SENSITIVE)
  payload.createdAt = serverTimestamp()
  payload.updatedAt = serverTimestamp()
  const ref = await addDoc(collection(db, "friends"), payload)
  return ref.id
}

export async function updateFriend(
  id: string,
  data: Partial<import("@/types").Friend>,
): Promise<void> {
  const payload = await encryptDoc({ ...data }, FRIEND_SENSITIVE)
  payload.updatedAt = serverTimestamp()
  if (isEncryptionReady()) payload._encrypted = true
  await updateDoc(doc(db, "friends", id), payload)
}

export async function deleteFriend(id: string): Promise<void> {
  await deleteDoc(doc(db, "friends", id))
}

// ---------------------------------------------------------------------------
// Family Members (Entity)
// ---------------------------------------------------------------------------

const FAMILY_MEMBER_SENSITIVE = ["name", "phone", "email"]

export async function getFamilyMembers(userId: string): Promise<import("@/types").FamilyMember[]> {
  const q = query(collection(db, "family_members"), where("userId", "==", userId))
  const snapshot = await getDocs(q)
  const results = await Promise.all(
    snapshot.docs.map(async (snap) => {
      const raw = { id: snap.id, ...snap.data() }
      return decryptDoc<import("@/types").FamilyMember>(raw, FAMILY_MEMBER_SENSITIVE)
    }),
  )
  return results.filter((r): r is import("@/types").FamilyMember => r !== null)
}

export async function addFamilyMember(
  data: Omit<import("@/types").FamilyMember, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  const payload = await encryptDoc({ ...data }, FAMILY_MEMBER_SENSITIVE)
  payload.createdAt = serverTimestamp()
  payload.updatedAt = serverTimestamp()
  const ref = await addDoc(collection(db, "family_members"), payload)
  return ref.id
}

export async function updateFamilyMember(
  id: string,
  data: Partial<import("@/types").FamilyMember>,
): Promise<void> {
  const payload = await encryptDoc({ ...data }, FAMILY_MEMBER_SENSITIVE)
  payload.updatedAt = serverTimestamp()
  if (isEncryptionReady()) payload._encrypted = true
  await updateDoc(doc(db, "family_members", id), payload)
}

export async function deleteFamilyMember(id: string): Promise<void> {
  await deleteDoc(doc(db, "family_members", id))
}

// ---------------------------------------------------------------------------
// Friends Ledger
// ---------------------------------------------------------------------------

const FRIENDS_LEDGER_SENSITIVE = ["amount", "description"]

export async function getFriendsLedger(userId: string): Promise<import("@/types").FriendsLedgerEntry[]> {
  const q = query(collection(db, "friends_ledger"), where("userId", "==", userId))
  const snapshot = await getDocs(q)
  const results = await Promise.all(
    snapshot.docs.map(async (snap) => {
      const raw = { id: snap.id, ...snap.data() }
      return decryptDoc<import("@/types").FriendsLedgerEntry>(raw, FRIENDS_LEDGER_SENSITIVE)
    }),
  )
  return results
    .filter((r): r is import("@/types").FriendsLedgerEntry => r !== null)
    .sort((a, b) => b.date.localeCompare(a.date))
}

export async function addFriendsLedgerEntry(
  data: Omit<import("@/types").FriendsLedgerEntry, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  const payload = await encryptDoc({ ...data }, FRIENDS_LEDGER_SENSITIVE)
  payload.createdAt = serverTimestamp()
  payload.updatedAt = serverTimestamp()
  const ref = await addDoc(collection(db, "friends_ledger"), payload)
  return ref.id
}

export async function updateFriendsLedgerEntry(
  id: string,
  data: Partial<import("@/types").FriendsLedgerEntry>,
): Promise<void> {
  const payload = await encryptDoc({ ...data }, FRIENDS_LEDGER_SENSITIVE)
  payload.updatedAt = serverTimestamp()
  if (isEncryptionReady()) payload._encrypted = true
  await updateDoc(doc(db, "friends_ledger", id), payload)
}

export async function deleteFriendsLedgerEntry(id: string): Promise<void> {
  await deleteDoc(doc(db, "friends_ledger", id))
}

// ---------------------------------------------------------------------------
// Family Ledger
// ---------------------------------------------------------------------------

const FAMILY_LEDGER_SENSITIVE = ["amount", "description"]

export async function getFamilyLedger(userId: string): Promise<import("@/types").FamilyLedgerEntry[]> {
  const q = query(collection(db, "family_ledger"), where("userId", "==", userId))
  const snapshot = await getDocs(q)
  const results = await Promise.all(
    snapshot.docs.map(async (snap) => {
      const raw = { id: snap.id, ...snap.data() }
      return decryptDoc<import("@/types").FamilyLedgerEntry>(raw, FAMILY_LEDGER_SENSITIVE)
    }),
  )
  return results
    .filter((r): r is import("@/types").FamilyLedgerEntry => r !== null)
    .sort((a, b) => b.date.localeCompare(a.date))
}

export async function addFamilyLedgerEntry(
  data: Omit<import("@/types").FamilyLedgerEntry, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  const payload = await encryptDoc({ ...data }, FAMILY_LEDGER_SENSITIVE)
  payload.createdAt = serverTimestamp()
  payload.updatedAt = serverTimestamp()
  const ref = await addDoc(collection(db, "family_ledger"), payload)
  return ref.id
}

export async function updateFamilyLedgerEntry(
  id: string,
  data: Partial<import("@/types").FamilyLedgerEntry>,
): Promise<void> {
  const payload = await encryptDoc({ ...data }, FAMILY_LEDGER_SENSITIVE)
  payload.updatedAt = serverTimestamp()
  if (isEncryptionReady()) payload._encrypted = true
  await updateDoc(doc(db, "family_ledger", id), payload)
}

export async function deleteFamilyLedgerEntry(id: string): Promise<void> {
  await deleteDoc(doc(db, "family_ledger", id))
}

// ---------------------------------------------------------------------------
// Properties
// ---------------------------------------------------------------------------

const PROPERTY_SENSITIVE = ["address", "currentValue", "purchasePrice", "monthlyRent", "monthlyEmi"]

export async function getProperties(userId: string): Promise<import("@/types").Property[]> {
  const q = query(collection(db, "properties"), where("userId", "==", userId))
  const snapshot = await getDocs(q)
  const results = await Promise.all(
    snapshot.docs.map(async (snap) => {
      const raw = { id: snap.id, ...snap.data() }
      return decryptDoc<import("@/types").Property>(raw, PROPERTY_SENSITIVE)
    }),
  )
  return results.filter((r): r is import("@/types").Property => r !== null)
}

export async function addProperty(
  data: Omit<import("@/types").Property, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  const payload = await encryptDoc({ ...data }, PROPERTY_SENSITIVE)
  payload.createdAt = serverTimestamp()
  payload.updatedAt = serverTimestamp()
  const ref = await addDoc(collection(db, "properties"), payload)
  return ref.id
}

export async function updateProperty(
  id: string,
  data: Partial<import("@/types").Property>,
): Promise<void> {
  const payload = await encryptDoc({ ...data }, PROPERTY_SENSITIVE)
  payload.updatedAt = serverTimestamp()
  if (isEncryptionReady()) payload._encrypted = true
  await updateDoc(doc(db, "properties", id), payload)
}

export async function deleteProperty(id: string): Promise<void> {
  await deleteDoc(doc(db, "properties", id))
}

// ---------------------------------------------------------------------------
// Custom Categories
// ---------------------------------------------------------------------------

export async function getCustomCategories(
  userId: string,
  group?: import("@/types").CategoryGroup,
): Promise<import("@/types").CustomCategory[]> {
  let q
  if (group) {
    q = query(
      collection(db, "custom_categories"),
      where("userId", "==", userId),
      where("group", "==", group),
    )
  } else {
    q = query(
      collection(db, "custom_categories"),
      where("userId", "==", userId),
    )
  }
  const snapshot = await getDocs(q)
  return snapshot.docs.map((snap) => ({
    id: snap.id,
    ...snap.data(),
  })) as import("@/types").CustomCategory[]
}

export async function addCustomCategory(
  data: Omit<import("@/types").CustomCategory, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  const payload: Record<string, unknown> = { ...data }
  payload.createdAt = serverTimestamp()
  payload.updatedAt = serverTimestamp()
  const ref = await addDoc(collection(db, "custom_categories"), payload)
  return ref.id
}

export async function deleteCustomCategory(id: string): Promise<void> {
  await deleteDoc(doc(db, "custom_categories", id))
}

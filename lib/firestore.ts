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

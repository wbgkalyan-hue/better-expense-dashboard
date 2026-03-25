import {
  collection,
  query,
  where,
  orderBy,
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
// Transactions
// ---------------------------------------------------------------------------

export async function getTransactions(userId: string): Promise<Transaction[]> {
  const q = query(
    collection(db, "transactions"),
    where("userId", "==", userId),
    orderBy("date", "desc"),
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map(docToData<Transaction>)
}

export async function addTransaction(
  data: Omit<Transaction, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  const ref = await addDoc(collection(db, "transactions"), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateTransaction(
  id: string,
  data: Partial<Transaction>,
): Promise<void> {
  await updateDoc(doc(db, "transactions", id), {
    ...data,
    updatedAt: serverTimestamp(),
  })
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
    orderBy("createdAt", "desc"),
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map(docToData<BrokerAccount>)
}

export async function addBrokerAccount(
  data: Omit<BrokerAccount, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  const ref = await addDoc(collection(db, "broker_accounts"), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function getBrokerAccount(
  id: string,
): Promise<BrokerAccount | null> {
  const snap = await getDoc(doc(db, "broker_accounts", id))
  return snap.exists() ? docToData<BrokerAccount>(snap) : null
}

// ---------------------------------------------------------------------------
// Investment Transactions
// ---------------------------------------------------------------------------

export async function getInvestmentTransactions(
  userId: string,
  brokerAccountId?: string,
): Promise<InvestmentTransaction[]> {
  const constraints = [
    where("userId", "==", userId),
    orderBy("date", "desc"),
  ]
  if (brokerAccountId) {
    constraints.push(where("brokerAccountId", "==", brokerAccountId))
  }
  const q = query(collection(db, "investment_transactions"), ...constraints)
  const snapshot = await getDocs(q)
  return snapshot.docs.map(docToData<InvestmentTransaction>)
}

export async function addInvestmentTransaction(
  data: Omit<InvestmentTransaction, "id" | "createdAt">,
): Promise<string> {
  const ref = await addDoc(collection(db, "investment_transactions"), {
    ...data,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

// ---------------------------------------------------------------------------
// Goals
// ---------------------------------------------------------------------------

export async function getGoals(userId: string): Promise<Goal[]> {
  const q = query(
    collection(db, "goals"),
    where("userId", "==", userId),
    orderBy("priority", "asc"),
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map(docToData<Goal>)
}

export async function addGoal(
  data: Omit<Goal, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  const ref = await addDoc(collection(db, "goals"), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateGoal(
  id: string,
  data: Partial<Goal>,
): Promise<void> {
  await updateDoc(doc(db, "goals", id), {
    ...data,
    updatedAt: serverTimestamp(),
  })
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
  return snapshot.docs.map(docToData<BankAccount>)
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
  return snapshot.docs.map(docToData<Asset>)
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
    orderBy("date", "desc"),
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map(docToData<NetworthSnapshot>)
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function docToData<T>(
  snap: DocumentData & { id: string; data: () => DocumentData },
): T {
  return { id: snap.id, ...snap.data() } as T
}

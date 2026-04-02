"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import {
  getTransactions,
  getBrokerAccounts,
  getInvestmentTransactions,
  getGoals,
  getNetworthSnapshots,
  getBrokerAccount,
} from "@/lib/firestore"
import type {
  Transaction,
  BrokerAccount,
  InvestmentTransaction,
  Goal,
  NetworthSnapshot,
  BankAccount,
  Asset,
} from "@/types"

interface QueryState<T> {
  data: T
  loading: boolean
  error: string | null
  refetch: () => void
}

function useFirestore<T>(
  fetcher: (uid: string) => Promise<T>,
  defaultValue: T,
) {
  const { user, encryptionReady } = useAuth()
  const [state, setState] = useState<Omit<QueryState<T>, "refetch">>({
    data: defaultValue,
    loading: true,
    error: null,
  })

  function load(uid: string) {
    setState((s) => ({ ...s, loading: true, error: null }))
    fetcher(uid)
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((err) =>
        setState({ data: defaultValue, loading: false, error: err.message }),
      )
  }

  useEffect(() => {
    if (!user) {
      setState({ data: defaultValue, loading: false, error: null })
      return
    }
    load(user.uid)
  }, [user, encryptionReady]) // eslint-disable-line react-hooks/exhaustive-deps

  return { ...state, refetch: () => user && load(user.uid) }
}

export function useTransactions() {
  return useFirestore<Transaction[]>(getTransactions, [])
}


export function useBrokerAccounts() {
  return useFirestore<BrokerAccount[]>(getBrokerAccounts, [])
}

export function useInvestmentTransactions(brokerAccountId?: string) {
  const { user, encryptionReady } = useAuth()
  const [state, setState] = useState<QueryState<InvestmentTransaction[]>>({
    data: [],
    loading: true,
    error: null,
  })

  useEffect(() => {
    if (!user) {
      setState({ data: [], loading: false, error: null })
      return
    }
    let cancelled = false
    setState((s) => ({ ...s, loading: true, error: null }))
    getInvestmentTransactions(user.uid, brokerAccountId)
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null })
      })
      .catch((err) => {
        if (!cancelled)
          setState({ data: [], loading: false, error: err.message })
      })
    return () => {
      cancelled = true
    }
  }, [user, brokerAccountId, encryptionReady])

  return state
}

export function useGoals() {
  return useFirestore<Goal[]>(getGoals, [])
}

export function useNetworthSnapshots() {
  return useFirestore<NetworthSnapshot[]>(getNetworthSnapshots, [])
}

export function useBrokerAccount(id: string) {
  const [state, setState] = useState<QueryState<BrokerAccount | null>>({
    data: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    let cancelled = false
    setState((s) => ({ ...s, loading: true, error: null }))
    getBrokerAccount(id)
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null })
      })
      .catch((err) => {
        if (!cancelled)
          setState({ data: null, loading: false, error: err.message })
      })
    return () => {
      cancelled = true
    }
  }, [id])

  return state
}

export function useBankAccounts() {
  return useFirestore<BankAccount[]>(
    (uid) => import("@/lib/firestore").then((m) => m.getBankAccounts(uid)),
    [],
  )
}

export function useAssets() {
  return useFirestore<Asset[]>(
    (uid) => import("@/lib/firestore").then((m) => m.getAssets(uid)),
    [],
  )
}

export function useRealEstateInvestments() {
  return useFirestore<import("@/types").RealEstateInvestment[]>(
    (uid) => import("@/lib/firestore").then((m) => m.getRealEstateInvestments(uid)),
    [],
  )
}

export function useInsurancePolicies() {
  return useFirestore<import("@/types").InsurancePolicy[]>(
    (uid) => import("@/lib/firestore").then((m) => m.getInsurancePolicies(uid)),
    [],
  )
}

export function useCreditCards() {
  return useFirestore<import("@/types").CreditCard[]>(
    (uid) => import("@/lib/firestore").then((m) => m.getCreditCards(uid)),
    [],
  )
}

export function useLoans() {
  return useFirestore<import("@/types").Loan[]>(
    (uid) => import("@/lib/firestore").then((m) => m.getLoans(uid)),
    [],
  )
}

export function useFriends() {
  return useFirestore<import("@/types").Friend[]>(
    (uid) => import("@/lib/firestore").then((m) => m.getFriends(uid)),
    [],
  )
}

export function useFamilyMembers() {
  return useFirestore<import("@/types").FamilyMember[]>(
    (uid) => import("@/lib/firestore").then((m) => m.getFamilyMembers(uid)),
    [],
  )
}

export function useFriendsLedger() {
  return useFirestore<import("@/types").FriendsLedgerEntry[]>(
    (uid) => import("@/lib/firestore").then((m) => m.getFriendsLedger(uid)),
    [],
  )
}

export function useFamilyLedger() {
  return useFirestore<import("@/types").FamilyLedgerEntry[]>(
    (uid) => import("@/lib/firestore").then((m) => m.getFamilyLedger(uid)),
    [],
  )
}

export function useProperties() {
  return useFirestore<import("@/types").Property[]>(
    (uid) => import("@/lib/firestore").then((m) => m.getProperties(uid)),
    [],
  )
}

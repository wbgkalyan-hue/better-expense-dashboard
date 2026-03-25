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
} from "@/types"

interface QueryState<T> {
  data: T
  loading: boolean
  error: string | null
}

function useFirestore<T>(
  fetcher: (uid: string) => Promise<T>,
  defaultValue: T,
) {
  const { user } = useAuth()
  const [state, setState] = useState<QueryState<T>>({
    data: defaultValue,
    loading: true,
    error: null,
  })

  useEffect(() => {
    if (!user) {
      setState({ data: defaultValue, loading: false, error: null })
      return
    }
    let cancelled = false
    setState((s) => ({ ...s, loading: true, error: null }))
    fetcher(user.uid)
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null })
      })
      .catch((err) => {
        if (!cancelled)
          setState({ data: defaultValue, loading: false, error: err.message })
      })
    return () => {
      cancelled = true
    }
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  return state
}

export function useTransactions() {
  return useFirestore<Transaction[]>(getTransactions, [])
}

export function useBrokerAccounts() {
  return useFirestore<BrokerAccount[]>(getBrokerAccounts, [])
}

export function useInvestmentTransactions(brokerAccountId?: string) {
  const { user } = useAuth()
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
  }, [user, brokerAccountId])

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

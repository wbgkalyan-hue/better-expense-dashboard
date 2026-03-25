export interface NetworthSnapshot {
  id: string
  userId: string
  date: string
  totalBank: number
  totalInvestments: number
  totalAssets: number
  totalDebts: number
  networth: number
  liquidFunds: number // easily accessible cash (savings, not FDs/locked)
  createdAt: string
}

export interface NetworthBreakdown {
  bank: number
  investments: number
  assets: number
  debts: number
  networth: number
  liquidFunds: number
  lockedByGoals: number // total amount locked by active goals
  availableNetworth: number // networth - lockedByGoals
}

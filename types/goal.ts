import { GoalType } from "./categories"

export interface Goal {
  id: string
  userId: string
  title: string
  type: GoalType | (string & {})
  targetAmount: number
  currentAmount: number
  priority: number // 1 = highest
  deadline?: string // ISO 8601
  isActive: boolean
  deductsFromNetworth: boolean // if true, targetAmount is "locked" from available networth
  description?: string
  createdAt: string
  updatedAt: string
}

export interface GoalAllocation {
  id: string
  goalId: string
  amount: number
  date: string
  note?: string
}

export interface GoalWithProgress extends Goal {
  progressPercent: number
  remainingAmount: number
  availableNetworth: number // networth available after higher-priority goals are deducted
  isFundingConflict: boolean // true if insufficient funds after higher-priority deductions
}

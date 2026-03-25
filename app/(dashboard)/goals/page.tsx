"use client"

import { useState, useMemo } from "react"
import {
  Plus,
  Target,
  AlertTriangle,
  Plane,
  Shield,
  ShoppingBag,
  CreditCard,
  TrendingUp,
  Star,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from "recharts"
import { GoalType, GOAL_TYPE_LABELS } from "@/types/categories"
import { useGoals, useNetworthSnapshots } from "@/lib/hooks"
import { useAuth } from "@/lib/auth-context"
import { addGoal } from "@/lib/firestore"
import { toast } from "sonner"
import type { Goal } from "@/types"

const GOAL_TYPE_ICONS: Record<GoalType, React.ElementType> = {
  [GoalType.TRIP]: Plane,
  [GoalType.EMERGENCY_FUND]: Shield,
  [GoalType.BIG_PURCHASE]: ShoppingBag,
  [GoalType.DEBT_PAYOFF]: CreditCard,
  [GoalType.INVESTMENT_TARGET]: TrendingUp,
  [GoalType.CUSTOM]: Star,
}

const GOAL_TYPE_COLORS: Record<GoalType, string> = {
  [GoalType.EMERGENCY_FUND]: "oklch(0.6 0.15 250)",
  [GoalType.TRIP]: "oklch(0.65 0.14 150)",
  [GoalType.BIG_PURCHASE]: "oklch(0.6 0.18 320)",
  [GoalType.DEBT_PAYOFF]: "oklch(0.65 0.15 45)",
  [GoalType.INVESTMENT_TARGET]: "oklch(0.58 0.12 220)",
  [GoalType.CUSTOM]: "oklch(0.7 0.1 45)",
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount)
}

function calculateGoalAllocations(goals: Goal[], networth: number) {
  let remainingNetworth = networth
  return goals
    .sort((a, b) => a.priority - b.priority)
    .map((goal) => {
      const progressPercent = goal.targetAmount > 0
        ? Math.round((goal.currentAmount / goal.targetAmount) * 100)
        : 0
      const remainingAmount = goal.targetAmount - goal.currentAmount
      const availableNetworth = remainingNetworth
      const isFundingConflict =
        goal.deductsFromNetworth && remainingAmount > remainingNetworth

      if (goal.deductsFromNetworth) {
        remainingNetworth = Math.max(0, remainingNetworth - goal.targetAmount)
      }

      return {
        ...goal,
        progressPercent,
        remainingAmount,
        availableNetworth,
        isFundingConflict,
      }
    })
}

export default function GoalsPage() {
  const { user } = useAuth()
  const { data: goals, loading: goalsLoading } = useGoals()
  const { data: networthSnaps, loading: nwLoading } = useNetworthSnapshots()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formTitle, setFormTitle] = useState("")
  const [formType, setFormType] = useState("")
  const [formAmount, setFormAmount] = useState("")
  const [formPriority, setFormPriority] = useState("")
  const [formDeadline, setFormDeadline] = useState("")

  const loading = goalsLoading || nwLoading
  const networth = networthSnaps[0]?.networth ?? 0

  const goalsWithProgress = useMemo(
    () => calculateGoalAllocations([...goals], networth),
    [goals, networth],
  )

  const lockedAmount = goals
    .filter((g) => g.deductsFromNetworth)
    .reduce((s, g) => s + g.targetAmount, 0)
  const availableAfterGoals = Math.max(0, networth - lockedAmount)
  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0)

  const allocationChartData = goalsWithProgress
    .filter((g) => g.deductsFromNetworth)
    .map((g) => ({
      name: g.title,
      target: g.targetAmount,
      saved: g.currentAmount,
      fill: GOAL_TYPE_COLORS[g.type] ?? "oklch(0.7 0.1 45)",
    }))

  const allocConfig: ChartConfig = {
    target: { label: "Target", color: "var(--chart-2)" },
    saved: { label: "Saved", color: "var(--chart-1)" },
  }

  async function handleCreate() {
    if (!user || !formTitle || !formType || !formAmount || !formPriority) return
    setSaving(true)
    try {
      await addGoal({
        userId: user.uid,
        title: formTitle,
        type: formType as GoalType,
        targetAmount: Number(formAmount),
        currentAmount: 0,
        priority: Number(formPriority),
        deadline: formDeadline || undefined,
        isActive: true,
        deductsFromNetworth: true,
      })
      toast.success("Goal created")
      setDialogOpen(false)
      setFormTitle("")
      setFormType("")
      setFormAmount("")
      setFormPriority("")
      setFormDeadline("")
      window.location.reload()
    } catch {
      toast.error("Failed to create goal")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Goals</h1>
          <p className="text-muted-foreground">Track progress towards your financial goals</p>
        </div>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Goals</h1>
          <p className="text-muted-foreground">
            Track progress towards your financial goals
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Goal</DialogTitle>
              <DialogDescription>
                Define a financial goal with a target amount and deadline
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="goal-title">Goal Title</Label>
                <Input id="goal-title" placeholder="e.g. Goa Trip 2026" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="goal-type">Type</Label>
                <Select value={formType} onValueChange={setFormType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select goal type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(GOAL_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="goal-amount">Target Amount (₹)</Label>
                <Input id="goal-amount" type="number" placeholder="0" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="goal-priority">Priority</Label>
                <Select value={formPriority} onValueChange={setFormPriority}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((p) => (
                      <SelectItem key={p} value={String(p)}>
                        {p} {p === 1 ? "(Highest)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="goal-deadline">Deadline</Label>
                <Input id="goal-deadline" type="date" value={formDeadline} onChange={(e) => setFormDeadline(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={saving || !formTitle || !formType || !formAmount || !formPriority}>
                {saving ? "Creating..." : "Create Goal"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Networth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(networth)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Locked by Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {formatCurrency(lockedAmount)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Available After Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(availableAfterGoals)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Saved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSaved)}</div>
            <p className="text-xs text-muted-foreground">
              across {goals.length} goals
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Allocation Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Goal Allocation vs Networth</CardTitle>
          <CardDescription>
            How your networth is allocated across goals that deduct from
            available funds (by priority)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={allocConfig} className="h-[250px] w-full">
            <BarChart
              data={allocationChartData}
              layout="vertical"
              accessibilityLayer
            >
              <CartesianGrid horizontal={false} />
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `₹${v / 1000}k`}
              />
              <YAxis
                type="category"
                dataKey="name"
                tickLine={false}
                axisLine={false}
                width={120}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => formatCurrency(value as number)}
                  />
                }
              />
              <Bar
                dataKey="target"
                fill="var(--color-target)"
                radius={[0, 4, 4, 0]}
                opacity={0.3}
              />
              <Bar
                dataKey="saved"
                fill="var(--color-saved)"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Goal Cards (Priority Order) */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">
          All Goals (by Priority)
        </h2>
        <div className="space-y-4">
          {goalsWithProgress.map((goal) => {
            const Icon = GOAL_TYPE_ICONS[goal.type] ?? Target
            return (
              <Card
                key={goal.id}
                className={goal.isFundingConflict ? "border-amber-500/50" : ""}
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
                    {/* Priority + Icon */}
                    <div className="flex items-center gap-3 sm:flex-col sm:items-center sm:gap-1">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Priority {goal.priority}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{goal.title}</h3>
                        <Badge variant="secondary">
                          {GOAL_TYPE_LABELS[goal.type]}
                        </Badge>
                        {goal.deductsFromNetworth && (
                          <Badge variant="outline" className="text-xs">
                            Deducts from networth
                          </Badge>
                        )}
                        {goal.isFundingConflict && (
                          <Badge
                            variant="destructive"
                            className="text-xs"
                          >
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            Funding conflict
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {formatCurrency(goal.currentAmount)} of{" "}
                            {formatCurrency(goal.targetAmount)}
                          </span>
                          <span className="font-medium">
                            {goal.progressPercent}%
                          </span>
                        </div>
                        <Progress
                          value={goal.progressPercent}
                          className="h-2.5"
                        />
                      </div>

                      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                        <span>
                          Remaining:{" "}
                          <strong className="text-foreground">
                            {formatCurrency(goal.remainingAmount)}
                          </strong>
                        </span>
                        {goal.deadline && (
                          <span>
                            Deadline:{" "}
                            <strong className="text-foreground">
                              {goal.deadline}
                            </strong>
                          </span>
                        )}
                        {goal.deductsFromNetworth && (
                          <span>
                            Available networth after this:{" "}
                            <strong className="text-foreground">
                              {formatCurrency(
                                Math.max(
                                  0,
                                  goal.availableNetworth - goal.targetAmount,
                                ),
                              )}
                            </strong>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}

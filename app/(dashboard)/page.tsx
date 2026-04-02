"use client"

import { useMemo } from "react"
import {
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  Loader2,
  Target,
  TrendingUp,
  Wallet,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
  Cell,
} from "recharts"
import {
  useTransactions,
  useBrokerAccounts,
  useGoals,
  useNetworthSnapshots,
} from "@/lib/hooks"
import {
  EXPENSE_CATEGORY_LABELS,
  GOAL_TYPE_LABELS,
  type ExpenseCategory,
} from "@/types/categories"

// --- Chart configs ---

const incomeExpenseConfig: ChartConfig = {
  income: { label: "Income", color: "var(--chart-1)" },
  expenses: { label: "Expenses", color: "var(--chart-5)" },
}

const networthConfig: ChartConfig = {
  networth: { label: "Networth", color: "var(--chart-1)" },
}

const CATEGORY_COLORS: Record<string, string> = {
  food: "oklch(0.65 0.15 45)",
  rent: "oklch(0.55 0.12 250)",
  transport: "oklch(0.7 0.14 150)",
  shopping: "oklch(0.6 0.18 320)",
  bills: "oklch(0.6 0.1 200)",
  groceries: "oklch(0.6 0.14 80)",
  entertainment: "oklch(0.65 0.16 340)",
  subscriptions: "oklch(0.58 0.12 220)",
  health: "oklch(0.6 0.12 160)",
  education: "oklch(0.6 0.1 280)",
  travel: "oklch(0.65 0.15 180)",
  personal: "oklch(0.65 0.1 30)",
  other: "oklch(0.7 0.05 100)",
}

const categoryConfig: ChartConfig = Object.fromEntries(
  Object.entries(CATEGORY_COLORS).map(([key, color]) => [
    key,
    { label: (EXPENSE_CATEGORY_LABELS as Record<string, string>)[key] ?? key, color },
  ]),
)

// --- Helpers ---

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount)
}

function getMonthLabel(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleString("en-US", { month: "short" })
}

function getYearMonth(dateStr: string): string {
  return dateStr.slice(0, 7) // "YYYY-MM"
}

function pctChange(current: number, previous: number): number {
  if (previous === 0) return 0
  return ((current - previous) / previous) * 100
}

function formatRelativeDate(dateStr: string): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(dateStr)
  d.setHours(0, 0, 0, 0)
  const diff = today.getTime() - d.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return "Today"
  if (days === 1) return "Yesterday"
  return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" })
}

export default function DashboardPage() {
  const { data: transactions, loading: txLoading } = useTransactions()
  const { data: brokers, loading: brkLoading } = useBrokerAccounts()
  const { data: goals, loading: goalsLoading } = useGoals()
  const { data: networthSnaps, loading: nwLoading } = useNetworthSnapshots()

  const loading = txLoading || brkLoading || goalsLoading || nwLoading

  // Compute monthly income/expense from transactions
  const { monthlyData, currentMonthIncome, currentMonthExpenses, prevMonthIncome, prevMonthExpenses } =
    useMemo(() => {
      const byMonth: Record<string, { income: number; expenses: number }> = {}
      for (const tx of transactions) {
        const ym = getYearMonth(tx.date)
        if (!byMonth[ym]) byMonth[ym] = { income: 0, expenses: 0 }
        if (tx.type === "income") byMonth[ym].income += tx.amount
        else byMonth[ym].expenses += tx.amount
      }
      const sorted = Object.entries(byMonth)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-6) // last 6 months
      const mapped = sorted.map(([ym, v]) => ({
        month: getMonthLabel(ym + "-01"),
        income: v.income,
        expenses: v.expenses,
      }))
      const cur = sorted.at(-1)?.[1] ?? { income: 0, expenses: 0 }
      const prev = sorted.at(-2)?.[1] ?? { income: 0, expenses: 0 }
      return {
        monthlyData: mapped,
        currentMonthIncome: cur.income,
        currentMonthExpenses: cur.expenses,
        prevMonthIncome: prev.income,
        prevMonthExpenses: prev.expenses,
      }
    }, [transactions])

  // Category breakdown for current month expenses
  const categoryBreakdown = useMemo(() => {
    const now = new Date()
    const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
    const byCat: Record<string, number> = {}
    for (const tx of transactions) {
      if (tx.type !== "expense") continue
      if (getYearMonth(tx.date) !== currentYM) continue
      const cat = tx.category
      byCat[cat] = (byCat[cat] || 0) + tx.amount
    }
    return Object.entries(byCat).map(([name, value]) => ({
      name: (EXPENSE_CATEGORY_LABELS as Record<string, string>)[name] ?? name,
      value,
      fill: CATEGORY_COLORS[name] ?? "oklch(0.7 0.05 100)",
    }))
  }, [transactions])

  // Networth trend from snapshots
  const networthTrend = useMemo(() => {
    return [...networthSnaps]
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-6)
      .map((s) => ({
        month: getMonthLabel(s.date),
        networth: s.networth,
      }))
  }, [networthSnaps])

  const currentNetworth = networthSnaps[0]?.networth ?? 0
  const prevNetworth = networthSnaps[1]?.networth ?? 0
  const networthChange = pctChange(currentNetworth, prevNetworth)

  // Investments summary
  const totalInvestmentValue = brokers.reduce((s, b) => s + b.currentValue, 0)
  const totalInvested = brokers.reduce((s, b) => s + b.totalInvested, 0)
  const investmentReturns = totalInvested > 0 ? pctChange(totalInvestmentValue, totalInvested) : 0

  // Recent transactions (last 5)
  const recentTx = transactions.slice(0, 5)

  // Top 3 goals
  const topGoals = goals.slice(0, 3)

  const incomeChange = pctChange(currentMonthIncome, prevMonthIncome)
  const expenseChange = pctChange(currentMonthExpenses, prevMonthExpenses)
  const currentMonthLabel = new Date().toLocaleString("en-US", { month: "short" })

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Your financial overview at a glance</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader>
              <CardContent><Skeleton className="h-8 w-32" /></CardContent>
            </Card>
          ))}
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Your financial overview at a glance
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Networth</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(currentNetworth)}</div>
            {prevNetworth > 0 && (
              <p className="text-xs text-muted-foreground">
                <span className={`inline-flex items-center ${networthChange >= 0 ? "text-green-600" : "text-red-500"}`}>
                  {networthChange >= 0 ? <ArrowUpRight className="mr-0.5 h-3 w-3" /> : <ArrowDownRight className="mr-0.5 h-3 w-3" />}
                  {Math.abs(networthChange).toFixed(1)}%
                </span>{" "}
                from last month
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Income ({currentMonthLabel})
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(currentMonthIncome)}</div>
            {prevMonthIncome > 0 && (
              <p className="text-xs text-muted-foreground">
                <span className={`inline-flex items-center ${incomeChange >= 0 ? "text-green-600" : "text-red-500"}`}>
                  {incomeChange >= 0 ? <ArrowUpRight className="mr-0.5 h-3 w-3" /> : <ArrowDownRight className="mr-0.5 h-3 w-3" />}
                  {Math.abs(incomeChange).toFixed(1)}%
                </span>{" "}
                from last month
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Expenses ({currentMonthLabel})
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(currentMonthExpenses)}</div>
            {prevMonthExpenses > 0 && (
              <p className="text-xs text-muted-foreground">
                <span className={`inline-flex items-center ${expenseChange <= 0 ? "text-green-600" : "text-red-500"}`}>
                  {expenseChange <= 0 ? <ArrowDownRight className="mr-0.5 h-3 w-3" /> : <ArrowUpRight className="mr-0.5 h-3 w-3" />}
                  {Math.abs(expenseChange).toFixed(1)}%
                </span>{" "}
                {expenseChange <= 0 ? "less" : "more"} than last month
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Investments</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalInvestmentValue)}</div>
            {totalInvested > 0 && (
              <p className="text-xs text-muted-foreground">
                <span className={`inline-flex items-center ${investmentReturns >= 0 ? "text-green-600" : "text-red-500"}`}>
                  {investmentReturns >= 0 ? <ArrowUpRight className="mr-0.5 h-3 w-3" /> : <ArrowDownRight className="mr-0.5 h-3 w-3" />}
                  {Math.abs(investmentReturns).toFixed(1)}%
                </span>{" "}
                returns overall
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-7">
        {/* Income vs Expenses Bar Chart */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Income vs Expenses</CardTitle>
            <CardDescription>Last 6 months comparison</CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyData.length > 0 ? (
              <ChartContainer config={incomeExpenseConfig} className="h-[300px] w-full">
                <BarChart data={monthlyData} accessibilityLayer>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `₹${v / 1000}k`}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => formatCurrency(value as number)}
                      />
                    }
                  />
                  <Bar dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" fill="var(--color-expenses)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                No transaction data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Spending by Category Pie Chart */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
            <CardDescription>This month&apos;s breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryBreakdown.length > 0 ? (
              <ChartContainer config={categoryConfig} className="mx-auto h-[300px] w-full">
                <PieChart accessibilityLayer>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => formatCurrency(value as number)}
                      />
                    }
                  />
                  <Pie
                    data={categoryBreakdown}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    strokeWidth={2}
                  >
                    {categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                No expenses this month
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Networth Trend + Goals Row */}
      <div className="grid gap-4 lg:grid-cols-7">
        {/* Networth Trend Line Chart */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Networth Trend</CardTitle>
            <CardDescription>Growth over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            {networthTrend.length > 0 ? (
              <ChartContainer config={networthConfig} className="h-[250px] w-full">
                <LineChart data={networthTrend} accessibilityLayer>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `₹${v / 1000}k`}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => formatCurrency(value as number)}
                      />
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="networth"
                    stroke="var(--color-networth)"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ChartContainer>
            ) : (
              <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
                No networth snapshots yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Goals Progress */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Goals</CardTitle>
            <CardDescription>Track your financial goals</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {topGoals.length > 0 ? (
              topGoals.map((goal) => {
                const percent = goal.targetAmount > 0
                  ? Math.round((goal.currentAmount / goal.targetAmount) * 100)
                  : 0
                return (
                  <div key={goal.id} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{goal.title}</span>
                        <Badge variant="secondary" className="text-xs">
                          {(GOAL_TYPE_LABELS as Record<string, string>)[goal.type] ?? goal.type}
                        </Badge>
                      </div>
                      <span className="text-muted-foreground">{percent}%</span>
                    </div>
                    <Progress value={percent} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{formatCurrency(goal.currentAmount)}</span>
                      <span>{formatCurrency(goal.targetAmount)}</span>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
                No goals created yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your latest financial activity</CardDescription>
        </CardHeader>
        <CardContent>
          {recentTx.length > 0 ? (
            <div className="space-y-4">
              {recentTx.map((tx) => {
                const isExpense = tx.type === "expense"
                const label = (EXPENSE_CATEGORY_LABELS as Record<string, string>)[tx.category] ?? tx.category
                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                  >
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">{tx.description}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeDate(tx.date)}
                        </span>
                        {tx.source === "auto" && (
                          <Badge variant="secondary" className="text-xs">auto</Badge>
                        )}
                      </div>
                    </div>
                    <span
                      className={`text-sm font-semibold ${
                        isExpense ? "text-red-500" : "text-green-600"
                      }`}
                    >
                      {isExpense ? "-" : "+"}
                      {formatCurrency(tx.amount)}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
              No transactions yet. Start adding from the mobile app or manually.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

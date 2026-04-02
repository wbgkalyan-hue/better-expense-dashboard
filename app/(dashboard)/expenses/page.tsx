"use client"

import { useState, useMemo } from "react"
import {
  Plus,
  Search,
  Filter,
  Receipt,
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
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell } from "recharts"
import {
  ExpenseCategory,
  EXPENSE_CATEGORY_LABELS,
} from "@/types/categories"
import { useTransactions } from "@/lib/hooks"
import { useAuth } from "@/lib/auth-context"
import { addTransaction } from "@/lib/firestore"
import { toast } from "sonner"

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

const dailyConfig: ChartConfig = {
  amount: { label: "Spent", color: "var(--chart-5)" },
}

const catConfig: ChartConfig = {
  value: { label: "Amount" },
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount)
}

function getYearMonth(dateStr: string): string {
  return dateStr.slice(0, 7)
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export default function ExpensesPage() {
  const { user } = useAuth()
  const { data: transactions, loading, refetch } = useTransactions()
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formAmount, setFormAmount] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formCategory, setFormCategory] = useState("")
  const [formMerchant, setFormMerchant] = useState("")
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10))

  // Only expenses
  const expenses = useMemo(
    () => transactions.filter((t) => t.type === "expense"),
    [transactions],
  )

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      const matchesSearch =
        search === "" ||
        e.description.toLowerCase().includes(search.toLowerCase()) ||
        (e.merchant ?? "").toLowerCase().includes(search.toLowerCase())
      const matchesCategory =
        categoryFilter === "all" || e.category === categoryFilter
      return matchesSearch && matchesCategory
    })
  }, [expenses, search, categoryFilter])

  // Current month stats
  const now = new Date()
  const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  const monthExpenses = useMemo(
    () => expenses.filter((e) => getYearMonth(e.date) === currentYM),
    [expenses, currentYM],
  )
  const totalSpent = monthExpenses.reduce((s, e) => s + e.amount, 0)

  // Daily spending (current week)
  const dailySpending = useMemo(() => {
    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay())
    startOfWeek.setHours(0, 0, 0, 0)

    const byDay: Record<string, number> = {}
    for (let i = 0; i < 7; i++) {
      byDay[DAY_NAMES[i]] = 0
    }
    for (const e of monthExpenses) {
      const d = new Date(e.date)
      if (d >= startOfWeek) {
        byDay[DAY_NAMES[d.getDay()]] = (byDay[DAY_NAMES[d.getDay()]] ?? 0) + e.amount
      }
    }
    return DAY_NAMES.map((day) => ({ day, amount: byDay[day] }))
  }, [monthExpenses])

  // Category breakdown
  const categoryData = useMemo(() => {
    const byCat: Record<string, number> = {}
    for (const e of monthExpenses) {
      byCat[e.category] = (byCat[e.category] ?? 0) + e.amount
    }
    return Object.entries(byCat).map(([cat, value]) => ({
      name: (EXPENSE_CATEGORY_LABELS as Record<string, string>)[cat] ?? cat,
      value,
      fill: CATEGORY_COLORS[cat] ?? "oklch(0.7 0.05 100)",
    }))
  }, [monthExpenses])

  async function handleSave() {
    if (!user || !formAmount || !formDescription || !formCategory) return
    setSaving(true)
    try {
      await addTransaction({
        userId: user.uid,
        amount: Number(formAmount),
        type: "expense",
        category: formCategory as ExpenseCategory,
        description: formDescription,
        merchant: formMerchant || undefined,
        date: formDate,
        source: "manual",
      })
      toast.success("Expense added")
      setDialogOpen(false)
      setFormAmount("")
      setFormDescription("")
      setFormCategory("")
      setFormMerchant("")
      refetch()
    } catch (err) {
      toast.error("Failed to add expense")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground">Track and manage your spending</p>
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
          <h1 className="text-2xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground">
            Track and manage your spending
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Expense</DialogTitle>
              <DialogDescription>
                Manually record a new expense transaction
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input id="amount" type="number" placeholder="0" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" placeholder="What did you spend on?" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(EXPENSE_CATEGORY_LABELS).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="merchant">Merchant</Label>
                <Input id="merchant" placeholder="Where did you pay?" value={formMerchant} onChange={(e) => setFormMerchant(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving || !formAmount || !formDescription || !formCategory}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary + Charts */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSpent)}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Daily Spending</CardTitle>
          </CardHeader>
          <CardContent>
            {dailySpending.some((d) => d.amount > 0) ? (
              <ChartContainer config={dailyConfig} className="h-[120px] w-full">
                <BarChart data={dailySpending} accessibilityLayer>
                  <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => formatCurrency(value as number)}
                      />
                    }
                  />
                  <Bar dataKey="amount" fill="var(--color-amount)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="flex h-[120px] items-center justify-center text-sm text-muted-foreground">
                No spending this week
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">By Category</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <ChartContainer config={catConfig} className="mx-auto h-[120px] w-full">
                <PieChart accessibilityLayer>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => formatCurrency(value as number)}
                      />
                    }
                  />
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={50}
                    strokeWidth={2}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="flex h-[120px] items-center justify-center text-sm text-muted-foreground">
                No categorized expenses
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters + Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Expenses</CardTitle>
          <CardDescription>
            Showing {filtered.length} of {expenses.length} transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search expenses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={categoryFilter}
              onValueChange={setCategoryFilter}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.entries(EXPENSE_CATEGORY_LABELS).map(
                  ([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Merchant</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="font-medium">
                      {expense.description}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {EXPENSE_CATEGORY_LABELS[
                          expense.category as ExpenseCategory
                        ] ?? expense.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {expense.merchant ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {expense.date}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          expense.source === "auto" ? "default" : "secondary"
                        }
                        className="text-xs"
                      >
                        {expense.source}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-red-500">
                      -{formatCurrency(expense.amount)}
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No expenses found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

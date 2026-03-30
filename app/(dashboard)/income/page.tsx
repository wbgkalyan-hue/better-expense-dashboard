"use client"

import { useState, useMemo } from "react"
import { Plus, Wallet, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useTransactions } from "@/lib/hooks"
import { useAuth } from "@/lib/auth-context"
import { addTransaction } from "@/lib/firestore"
import { IncomeCategory, INCOME_CATEGORY_LABELS } from "@/types/categories"
import { toast } from "sonner"

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function IncomePage() {
  const { user } = useAuth()
  const { data: transactions, loading } = useTransactions()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const [formDesc, setFormDesc] = useState("")
  const [formAmount, setFormAmount] = useState("")
  const [formCategory, setFormCategory] = useState<string>("")
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0])

  const incomeTransactions = useMemo(
    () => transactions.filter((t) => t.type === "income"),
    [transactions],
  )

  const totalIncome = incomeTransactions.reduce((s, t) => s + t.amount, 0)
  const currentMonthIncome = useMemo(() => {
    const now = new Date()
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
    return incomeTransactions
      .filter((t) => t.date.startsWith(ym))
      .reduce((s, t) => s + t.amount, 0)
  }, [incomeTransactions])

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {}
    for (const t of incomeTransactions) {
      map[t.category] = (map[t.category] || 0) + t.amount
    }
    return Object.entries(map).sort(([, a], [, b]) => b - a)
  }, [incomeTransactions])

  async function handleAdd() {
    if (!user || !formDesc || !formAmount || !formCategory) return
    setSaving(true)
    try {
      await addTransaction({
        userId: user.uid,
        amount: parseFloat(formAmount),
        type: "income",
        category: formCategory as IncomeCategory,
        description: formDesc,
        date: formDate,
        source: "manual",
      })
      toast.success("Income added")
      setDialogOpen(false)
      setFormDesc("")
      setFormAmount("")
      setFormCategory("")
      window.location.reload()
    } catch {
      toast.error("Failed to add income")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Income</h1>
            <p className="text-muted-foreground">Track your income sources and earnings</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}><CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader><CardContent><Skeleton className="h-8 w-32" /></CardContent></Card>
          ))}
        </div>
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Income</h1>
          <p className="text-muted-foreground">
            Track your income sources and earnings
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Add Income</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Income</DialogTitle>
              <DialogDescription>Record a new income transaction</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Description</Label>
                <Input placeholder="e.g. March Salary" value={formDesc} onChange={(e) => setFormDesc(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Amount (₹)</Label>
                <Input type="number" placeholder="85000" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Category</Label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(INCOME_CATEGORY_LABELS).map(([val, label]) => (
                      <SelectItem key={val} value={val}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Date</Label>
                <Input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAdd} disabled={saving || !formDesc || !formAmount || !formCategory}>
                {saving ? "Saving..." : "Add Income"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Income</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">This Month</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatCurrency(currentMonthIncome)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Sources</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{byCategory.length}</div></CardContent>
        </Card>
      </div>

      {/* Category breakdown */}
      {byCategory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Income by Source</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {byCategory.map(([cat, amount]) => (
                <div key={cat} className="flex items-center justify-between">
                  <span className="text-sm">
                    {(INCOME_CATEGORY_LABELS as Record<string, string>)[cat] ?? cat}
                  </span>
                  <span className="text-sm font-medium text-green-600">
                    {formatCurrency(amount)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Income Table */}
      {incomeTransactions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Wallet className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No income recorded yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Click "Add Income" to record your first income transaction.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Income History</CardTitle>
            <CardDescription>{incomeTransactions.length} transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incomeTransactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-medium">{tx.description}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {(INCOME_CATEGORY_LABELS as Record<string, string>)[tx.category] ?? tx.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(tx.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </TableCell>
                    <TableCell className="text-right font-medium text-green-600">
                      +{formatCurrency(tx.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

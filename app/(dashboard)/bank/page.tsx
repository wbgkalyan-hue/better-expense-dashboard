"use client"

import { useState } from "react"
import { Plus, Landmark, Loader2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useBankAccounts } from "@/lib/hooks"
import { useAuth } from "@/lib/auth-context"
import { addBankAccount, deleteBankAccount } from "@/lib/firestore"
import { BankAccountType, BANK_ACCOUNT_TYPE_LABELS } from "@/types/categories"
import { CategorySelect, labelMapToOptions } from "@/components/ui/category-select"
import { DatePicker } from "@/components/ui/date-picker"
import { toast } from "sonner"

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount)
}

const TYPE_COLORS: Record<string, string> = {
  savings: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400",
  fd: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400",
  rd: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-400",
  current: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400",
  other: "bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-400",
}

export default function BankPage() {
  const { user } = useAuth()
  const { data: accounts, loading } = useBankAccounts()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const [formName, setFormName] = useState("")
  const [formBankName, setFormBankName] = useState("")
  const [formType, setFormType] = useState<string>("")
  const [formBalance, setFormBalance] = useState("")
  const [formInterestRate, setFormInterestRate] = useState("")
  const [formMaturityDate, setFormMaturityDate] = useState("")

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0)
  const byType = accounts.reduce(
    (map, a) => ({ ...map, [a.type]: (map[a.type] || 0) + a.balance }),
    {} as Record<string, number>,
  )

  async function handleAdd() {
    if (!user || !formName || !formBankName || !formType || !formBalance) return
    setSaving(true)
    try {
      await addBankAccount({
        userId: user.uid,
        name: formName,
        bankName: formBankName,
        type: formType as BankAccountType,
        balance: parseFloat(formBalance),
        interestRate: formInterestRate ? parseFloat(formInterestRate) : undefined,
        maturityDate: formMaturityDate || undefined,
      })
      toast.success("Bank account added")
      setDialogOpen(false)
      setFormName("")
      setFormBankName("")
      setFormType("")
      setFormBalance("")
      setFormInterestRate("")
      setFormMaturityDate("")
      window.location.reload()
    } catch {
      toast.error("Failed to add bank account")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!user) return
    try {
      await deleteBankAccount(id)
      toast.success("Account deleted")
      window.location.reload()
    } catch {
      toast.error("Failed to delete account")
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Bank Accounts</h1>
            <p className="text-muted-foreground">Manage savings, FDs, RDs, and other bank accounts</p>
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
          <h1 className="text-2xl font-bold tracking-tight">Bank Accounts</h1>
          <p className="text-muted-foreground">
            Manage savings, FDs, RDs, and other bank accounts
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Add Account</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Bank Account</DialogTitle>
              <DialogDescription>Add a new bank account to track its balance</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Account Name</Label>
                <Input placeholder="e.g. Main Savings" value={formName} onChange={(e) => setFormName(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Bank Name</Label>
                <Input placeholder="e.g. SBI, HDFC" value={formBankName} onChange={(e) => setFormBankName(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Account Type</Label>
                <CategorySelect
                  group="bank_account_type"
                  options={labelMapToOptions(BANK_ACCOUNT_TYPE_LABELS)}
                  value={formType}
                  onValueChange={setFormType}
                  placeholder="Select type"
                />
              </div>
              <div className="grid gap-2">
                <Label>Balance (₹)</Label>
                <Input type="number" placeholder="100000" value={formBalance} onChange={(e) => setFormBalance(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Interest Rate (%) — optional</Label>
                <Input type="number" step="0.1" placeholder="6.5" value={formInterestRate} onChange={(e) => setFormInterestRate(e.target.value)} />
              </div>
              {(formType === "fd" || formType === "rd") && (
                <div className="grid gap-2">
                  <Label>Maturity Date</Label>
                  <DatePicker value={formMaturityDate} onChange={setFormMaturityDate} />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={handleAdd} disabled={saving || !formName || !formBankName || !formType || !formBalance}>
                {saving ? "Saving..." : "Add Account"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Balance</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-emerald-600">{formatCurrency(totalBalance)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Accounts</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{accounts.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Account Types</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{Object.keys(byType).length}</div></CardContent>
        </Card>
      </div>

      {/* Balance by type */}
      {Object.keys(byType).length > 0 && (
        <Card>
          <CardHeader><CardTitle>Balance by Type</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(byType).sort(([,a],[,b]) => b - a).map(([type, amount]) => (
                <div key={type} className="flex items-center justify-between">
                  <Badge className={TYPE_COLORS[type] || TYPE_COLORS.other}>
                    {(BANK_ACCOUNT_TYPE_LABELS as Record<string, string>)[type] ?? type}
                  </Badge>
                  <span className="text-sm font-medium">{formatCurrency(amount)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Account Cards */}
      {accounts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Landmark className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No bank accounts yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Click "Add Account" to start tracking your bank accounts.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <Card key={account.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{account.name}</CardTitle>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(account.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription>{account.bankName}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(account.balance)}</div>
                <div className="mt-2 flex items-center gap-2">
                  <Badge className={TYPE_COLORS[account.type] || TYPE_COLORS.other}>
                    {BANK_ACCOUNT_TYPE_LABELS[account.type]}
                  </Badge>
                  {account.interestRate && (
                    <span className="text-xs text-muted-foreground">{account.interestRate}% p.a.</span>
                  )}
                </div>
                {account.maturityDate && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Matures: {new Date(account.maturityDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

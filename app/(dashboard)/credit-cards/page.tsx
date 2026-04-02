"use client"
import { useState, useMemo } from "react"
import { Plus, CreditCard as CreditCardIcon, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { useCreditCards } from "@/lib/hooks"
import { addCreditCard } from "@/lib/firestore"
import { DatePicker } from "@/components/ui/date-picker"
import { toast } from "sonner"

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount)
}

export default function CreditCardsPage() {
  const { user } = useAuth()
  const { data: cards, loading, refetch } = useCreditCards()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const [formName, setFormName] = useState("")
  const [formBank, setFormBank] = useState("")
  const [formLast4, setFormLast4] = useState("")
  const [formCreditLimit, setFormCreditLimit] = useState("")
  const [formOutstanding, setFormOutstanding] = useState("")
  const [formMinPayment, setFormMinPayment] = useState("")
  const [formDueDate, setFormDueDate] = useState("")
  const [formInterestRate, setFormInterestRate] = useState("")
  const [formNotes, setFormNotes] = useState("")

  const totalLimit = useMemo(() => cards.reduce((s, c) => s + c.creditLimit, 0), [cards])
  const totalOutstanding = useMemo(() => cards.reduce((s, c) => s + c.outstandingBalance, 0), [cards])
  const utilisation = totalLimit > 0 ? Math.round((totalOutstanding / totalLimit) * 100) : 0

  async function handleSave() {
    if (!user || !formName || !formBank || !formCreditLimit || !formOutstanding) return
    setSaving(true)
    try {
      await addCreditCard({
        userId: user.uid,
        name: formName,
        bank: formBank,
        last4: formLast4 || undefined,
        creditLimit: Number(formCreditLimit),
        outstandingBalance: Number(formOutstanding),
        minPayment: formMinPayment ? Number(formMinPayment) : undefined,
        dueDate: formDueDate || undefined,
        interestRate: formInterestRate ? Number(formInterestRate) : undefined,
        notes: formNotes || undefined,
      })
      toast.success("Card added")
      setDialogOpen(false)
      setFormName(""); setFormBank(""); setFormLast4(""); setFormCreditLimit("")
      setFormOutstanding(""); setFormMinPayment(""); setFormDueDate("")
      setFormInterestRate(""); setFormNotes("")
      refetch()
    } catch {
      toast.error("Failed to add card")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Credit Cards</h1>
          <p className="text-muted-foreground">Track your credit card balances and limits</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Add Card</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Credit Card</DialogTitle>
              <DialogDescription>Record a credit card</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-2">
                  <Label>Card Name</Label>
                  <Input placeholder="e.g. HDFC Regalia" value={formName} onChange={e => setFormName(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Bank</Label>
                  <Input placeholder="e.g. HDFC" value={formBank} onChange={e => setFormBank(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-2">
                  <Label>Last 4 Digits</Label>
                  <Input placeholder="XXXX" maxLength={4} value={formLast4} onChange={e => setFormLast4(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Interest Rate (%)</Label>
                  <Input type="number" placeholder="e.g. 42" value={formInterestRate} onChange={e => setFormInterestRate(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-2">
                  <Label>Credit Limit (₹)</Label>
                  <Input type="number" placeholder="0" value={formCreditLimit} onChange={e => setFormCreditLimit(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Outstanding (₹)</Label>
                  <Input type="number" placeholder="0" value={formOutstanding} onChange={e => setFormOutstanding(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-2">
                  <Label>Min Payment (₹)</Label>
                  <Input type="number" placeholder="Optional" value={formMinPayment} onChange={e => setFormMinPayment(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Due Date</Label>
                  <DatePicker value={formDueDate} onChange={setFormDueDate} placeholder="Pick due date" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Notes</Label>
                <Input placeholder="Optional" value={formNotes} onChange={e => setFormNotes(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving || !formName || !formBank || !formCreditLimit || !formOutstanding}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Credit Limit</CardTitle>
            <CreditCardIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatCurrency(totalLimit)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
            <CreditCardIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{formatCurrency(totalOutstanding)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Credit Utilisation</CardTitle>
            <CreditCardIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${utilisation > 30 ? "text-red-500" : "text-green-500"}`}>{utilisation}%</div>
            <p className="text-xs text-muted-foreground">Keep below 30% for good credit score</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Cards</CardTitle>
          <CardDescription>{cards.length} card{cards.length !== 1 ? "s" : ""}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Card</TableHead>
                  <TableHead>Bank</TableHead>
                  <TableHead>Last 4</TableHead>
                  <TableHead>Credit Limit</TableHead>
                  <TableHead>Outstanding</TableHead>
                  <TableHead>Utilisation</TableHead>
                  <TableHead>Due Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cards.map(c => {
                  const util = c.creditLimit > 0 ? Math.round((c.outstandingBalance / c.creditLimit) * 100) : 0
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>{c.bank}</TableCell>
                      <TableCell className="text-muted-foreground">••••{c.last4 ?? "—"}</TableCell>
                      <TableCell>{formatCurrency(c.creditLimit)}</TableCell>
                      <TableCell className="text-red-500">{formatCurrency(c.outstandingBalance)}</TableCell>
                      <TableCell>
                        <Badge variant={util > 30 ? "destructive" : "secondary"}>{util}%</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{c.dueDate ?? "—"}</TableCell>
                    </TableRow>
                  )
                })}
                {cards.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No cards yet.</TableCell>
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

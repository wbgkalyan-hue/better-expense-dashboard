"use client"
import { useState, useMemo } from "react"
import { Plus, Landmark, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/auth-context"
import { useLoans } from "@/lib/hooks"
import { addLoan } from "@/lib/firestore"
import { LOAN_TYPE_LABELS, type LoanType } from "@/types"
import { toast } from "sonner"

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount)
}

export default function LoansPage() {
  const { user } = useAuth()
  const { data: loans, loading, refetch } = useLoans()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const [formName, setFormName] = useState("")
  const [formLender, setFormLender] = useState("")
  const [formType, setFormType] = useState<LoanType>("personal")
  const [formPrincipal, setFormPrincipal] = useState("")
  const [formOutstanding, setFormOutstanding] = useState("")
  const [formRate, setFormRate] = useState("")
  const [formEmi, setFormEmi] = useState("")
  const [formStartDate, setFormStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [formEndDate, setFormEndDate] = useState("")

  const totalPrincipal = useMemo(() => loans.reduce((s, l) => s + l.principalAmount, 0), [loans])
  const totalOutstanding = useMemo(() => loans.reduce((s, l) => s + l.outstandingAmount, 0), [loans])
  const totalEmi = useMemo(() => loans.reduce((s, l) => s + l.emiAmount, 0), [loans])

  async function handleSave() {
    if (!user || !formName || !formLender || !formPrincipal || !formOutstanding || !formRate || !formEmi) return
    setSaving(true)
    try {
      await addLoan({
        userId: user.uid,
        name: formName,
        lender: formLender,
        type: formType,
        principalAmount: Number(formPrincipal),
        outstandingAmount: Number(formOutstanding),
        interestRate: Number(formRate),
        emiAmount: Number(formEmi),
        startDate: formStartDate,
        endDate: formEndDate || undefined,
      })
      toast.success("Loan added")
      setDialogOpen(false)
      setFormName(""); setFormLender(""); setFormType("personal")
      setFormPrincipal(""); setFormOutstanding(""); setFormRate("")
      setFormEmi(""); setFormEndDate("")
      refetch()
    } catch {
      toast.error("Failed to add loan")
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
          <h1 className="text-2xl font-bold tracking-tight">Loans</h1>
          <p className="text-muted-foreground">Track your loan obligations and EMIs</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Add Loan</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Loan</DialogTitle>
              <DialogDescription>Record a loan or EMI obligation</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-2">
                  <Label>Loan Name</Label>
                  <Input placeholder="e.g. Home Loan" value={formName} onChange={e => setFormName(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Lender</Label>
                  <Input placeholder="e.g. SBI" value={formLender} onChange={e => setFormLender(e.target.value)} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Type</Label>
                <Select value={formType} onValueChange={v => setFormType(v as LoanType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(LOAN_TYPE_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-2">
                  <Label>Principal (₹)</Label>
                  <Input type="number" placeholder="0" value={formPrincipal} onChange={e => setFormPrincipal(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Outstanding (₹)</Label>
                  <Input type="number" placeholder="0" value={formOutstanding} onChange={e => setFormOutstanding(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-2">
                  <Label>Interest Rate (%)</Label>
                  <Input type="number" placeholder="e.g. 8.5" value={formRate} onChange={e => setFormRate(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>EMI / Month (₹)</Label>
                  <Input type="number" placeholder="0" value={formEmi} onChange={e => setFormEmi(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-2">
                  <Label>Start Date</Label>
                  <Input type="date" value={formStartDate} onChange={e => setFormStartDate(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>End Date</Label>
                  <Input type="date" value={formEndDate} onChange={e => setFormEndDate(e.target.value)} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving || !formName || !formLender || !formPrincipal || !formOutstanding || !formRate || !formEmi}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Principal</CardTitle>
            <Landmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatCurrency(totalPrincipal)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
            <Landmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-red-500">{formatCurrency(totalOutstanding)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total EMI / Month</CardTitle>
            <Landmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatCurrency(totalEmi)}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Loans</CardTitle>
          <CardDescription>{loans.length} loan{loans.length !== 1 ? "s" : ""}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Lender</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Principal</TableHead>
                  <TableHead>Outstanding</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>EMI / Mo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loans.map(l => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{l.name}</TableCell>
                    <TableCell>{l.lender}</TableCell>
                    <TableCell><Badge variant="outline">{LOAN_TYPE_LABELS[l.type]}</Badge></TableCell>
                    <TableCell>{formatCurrency(l.principalAmount)}</TableCell>
                    <TableCell className="text-red-500">{formatCurrency(l.outstandingAmount)}</TableCell>
                    <TableCell>{l.interestRate}%</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(l.emiAmount)}</TableCell>
                  </TableRow>
                ))}
                {loans.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No loans yet.</TableCell>
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

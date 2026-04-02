"use client"
import { useState, useMemo } from "react"
import { Plus, Building2, TrendingUp, Loader2, IndianRupee } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/auth-context"
import { useRealEstateInvestments } from "@/lib/hooks"
import { addRealEstateInvestment } from "@/lib/firestore"
import { RE_INVESTMENT_TYPE_LABELS, type RealEstateInvestmentType } from "@/types"
import { toast } from "sonner"

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount)
}

export default function ReInvestmentsPage() {
  const { user } = useAuth()
  const { data: investments, loading, refetch } = useRealEstateInvestments()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const [formName, setFormName] = useState("")
  const [formLocation, setFormLocation] = useState("")
  const [formType, setFormType] = useState<RealEstateInvestmentType>("residential")
  const [formPurchasePrice, setFormPurchasePrice] = useState("")
  const [formCurrentValue, setFormCurrentValue] = useState("")
  const [formMonthlyRent, setFormMonthlyRent] = useState("")
  const [formPurchaseDate, setFormPurchaseDate] = useState(new Date().toISOString().slice(0, 10))
  const [formNotes, setFormNotes] = useState("")

  const totalInvested = useMemo(() => investments.reduce((s, i) => s + i.purchasePrice, 0), [investments])
  const totalCurrentValue = useMemo(() => investments.reduce((s, i) => s + i.currentValue, 0), [investments])
  const totalGain = totalCurrentValue - totalInvested
  const totalMonthlyRent = useMemo(() => investments.reduce((s, i) => s + (i.monthlyRent ?? 0), 0), [investments])

  async function handleSave() {
    if (!user || !formName || !formPurchasePrice || !formCurrentValue) return
    setSaving(true)
    try {
      await addRealEstateInvestment({
        userId: user.uid,
        name: formName,
        location: formLocation,
        type: formType,
        purchasePrice: Number(formPurchasePrice),
        currentValue: Number(formCurrentValue),
        monthlyRent: formMonthlyRent ? Number(formMonthlyRent) : undefined,
        purchaseDate: formPurchaseDate,
        notes: formNotes || undefined,
      })
      toast.success("Investment added")
      setDialogOpen(false)
      setFormName(""); setFormLocation(""); setFormType("residential")
      setFormPurchasePrice(""); setFormCurrentValue(""); setFormMonthlyRent("")
      setFormNotes("")
      refetch()
    } catch {
      toast.error("Failed to add investment")
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
          <h1 className="text-2xl font-bold tracking-tight">RE-Investments</h1>
          <p className="text-muted-foreground">Track your real estate investments</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Add Investment</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add RE Investment</DialogTitle>
              <DialogDescription>Record a new real estate investment</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Name</Label>
                <Input placeholder="Property name" value={formName} onChange={e => setFormName(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Location</Label>
                <Input placeholder="City / Area" value={formLocation} onChange={e => setFormLocation(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Type</Label>
                <Select value={formType} onValueChange={v => setFormType(v as RealEstateInvestmentType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(RE_INVESTMENT_TYPE_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-2">
                  <Label>Purchase Price (₹)</Label>
                  <Input type="number" placeholder="0" value={formPurchasePrice} onChange={e => setFormPurchasePrice(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Current Value (₹)</Label>
                  <Input type="number" placeholder="0" value={formCurrentValue} onChange={e => setFormCurrentValue(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-2">
                  <Label>Monthly Rent (₹)</Label>
                  <Input type="number" placeholder="0 (optional)" value={formMonthlyRent} onChange={e => setFormMonthlyRent(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Purchase Date</Label>
                  <Input type="date" value={formPurchaseDate} onChange={e => setFormPurchaseDate(e.target.value)} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Notes</Label>
                <Input placeholder="Optional notes" value={formNotes} onChange={e => setFormNotes(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving || !formName || !formPurchasePrice || !formCurrentValue}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatCurrency(totalInvested)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Current Value</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatCurrency(totalCurrentValue)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Gain</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalGain >= 0 ? "text-green-500" : "text-red-500"}`}>
              {totalGain >= 0 ? "+" : ""}{formatCurrency(totalGain)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Monthly Rent</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatCurrency(totalMonthlyRent)}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Properties</CardTitle>
          <CardDescription>{investments.length} investment{investments.length !== 1 ? "s" : ""}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Purchase Price</TableHead>
                  <TableHead>Current Value</TableHead>
                  <TableHead>Monthly Rent</TableHead>
                  <TableHead>Gain/Loss</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {investments.map(inv => {
                  const gain = inv.currentValue - inv.purchasePrice
                  return (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">{inv.name}</TableCell>
                      <TableCell className="text-muted-foreground">{inv.location}</TableCell>
                      <TableCell><Badge variant="outline">{RE_INVESTMENT_TYPE_LABELS[inv.type]}</Badge></TableCell>
                      <TableCell>{formatCurrency(inv.purchasePrice)}</TableCell>
                      <TableCell>{formatCurrency(inv.currentValue)}</TableCell>
                      <TableCell>{inv.monthlyRent ? formatCurrency(inv.monthlyRent) : "—"}</TableCell>
                      <TableCell className={gain >= 0 ? "text-green-500 font-semibold" : "text-red-500 font-semibold"}>
                        {gain >= 0 ? "+" : ""}{formatCurrency(gain)}
                      </TableCell>
                    </TableRow>
                  )
                })}
                {investments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No investments yet.</TableCell>
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

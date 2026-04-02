"use client"
import { useState, useMemo } from "react"
import { Plus, Shield, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/auth-context"
import { useInsurancePolicies } from "@/lib/hooks"
import { addInsurancePolicy } from "@/lib/firestore"
import { INSURANCE_TYPE_LABELS, INSURANCE_FREQUENCY_LABELS, type InsuranceType, type InsuranceFrequency } from "@/types"
import { CategorySelect, labelMapToOptions } from "@/components/ui/category-select"
import { DatePicker } from "@/components/ui/date-picker"
import { toast } from "sonner"

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount)
}

function yearlyPremium(premium: number, frequency: InsuranceFrequency) {
  if (frequency === "monthly") return premium * 12
  if (frequency === "quarterly") return premium * 4
  return premium
}

export default function InsurancePage() {
  const { user } = useAuth()
  const { data: policies, loading, refetch } = useInsurancePolicies()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const [formName, setFormName] = useState("")
  const [formInsurer, setFormInsurer] = useState("")
  const [formType, setFormType] = useState<InsuranceType>("life")
  const [formPolicyNumber, setFormPolicyNumber] = useState("")
  const [formPremium, setFormPremium] = useState("")
  const [formFrequency, setFormFrequency] = useState<InsuranceFrequency>("yearly")
  const [formCoverage, setFormCoverage] = useState("")
  const [formStartDate, setFormStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [formEndDate, setFormEndDate] = useState("")

  const totalYearlyPremium = useMemo(
    () => policies.reduce((s, p) => s + yearlyPremium(p.premium, p.frequency), 0),
    [policies],
  )
  const totalCoverage = useMemo(() => policies.reduce((s, p) => s + p.coverageAmount, 0), [policies])

  async function handleSave() {
    if (!user || !formName || !formInsurer || !formPremium || !formCoverage) return
    setSaving(true)
    try {
      await addInsurancePolicy({
        userId: user.uid,
        name: formName,
        insurer: formInsurer,
        type: formType,
        policyNumber: formPolicyNumber || undefined,
        premium: Number(formPremium),
        coverageAmount: Number(formCoverage),
        startDate: formStartDate,
        endDate: formEndDate || undefined,
        frequency: formFrequency,
      })
      toast.success("Policy added")
      setDialogOpen(false)
      setFormName(""); setFormInsurer(""); setFormPolicyNumber("")
      setFormPremium(""); setFormCoverage(""); setFormEndDate("")
      refetch()
    } catch {
      toast.error("Failed to add policy")
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
          <h1 className="text-2xl font-bold tracking-tight">Insurance</h1>
          <p className="text-muted-foreground">Manage your insurance policies</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Add Policy</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Insurance Policy</DialogTitle>
              <DialogDescription>Record a new insurance policy</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-2">
                  <Label>Policy Name</Label>
                  <Input placeholder="e.g. Term Life" value={formName} onChange={e => setFormName(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Insurer</Label>
                  <Input placeholder="e.g. LIC" value={formInsurer} onChange={e => setFormInsurer(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-2">
                  <Label>Type</Label>
                  <CategorySelect
                    group="insurance_type"
                    options={labelMapToOptions(INSURANCE_TYPE_LABELS)}
                    value={formType}
                    onValueChange={(v) => setFormType(v as InsuranceType)}
                    placeholder="Select type"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Policy Number</Label>
                  <Input placeholder="Optional" value={formPolicyNumber} onChange={e => setFormPolicyNumber(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-2">
                  <Label>Premium (₹)</Label>
                  <Input type="number" placeholder="0" value={formPremium} onChange={e => setFormPremium(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Frequency</Label>
                  <Select value={formFrequency} onValueChange={v => setFormFrequency(v as InsuranceFrequency)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(INSURANCE_FREQUENCY_LABELS).map(([v, l]) => (
                        <SelectItem key={v} value={v}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Coverage Amount (₹)</Label>
                <Input type="number" placeholder="0" value={formCoverage} onChange={e => setFormCoverage(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-2">
                  <Label>Start Date</Label>
                  <DatePicker value={formStartDate} onChange={setFormStartDate} />
                </div>
                <div className="grid gap-2">
                  <Label>End Date</Label>
                  <DatePicker value={formEndDate} onChange={setFormEndDate} placeholder="Optional" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving || !formName || !formInsurer || !formPremium || !formCoverage}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Policies</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{policies.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Premium / Year</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatCurrency(totalYearlyPremium)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Coverage</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatCurrency(totalCoverage)}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Policies</CardTitle>
          <CardDescription>{policies.length} polic{policies.length !== 1 ? "ies" : "y"}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Insurer</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Premium</TableHead>
                  <TableHead>Coverage</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {policies.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{p.insurer}</TableCell>
                    <TableCell><Badge variant="outline">{INSURANCE_TYPE_LABELS[p.type]}</Badge></TableCell>
                    <TableCell>{formatCurrency(p.premium)} / {INSURANCE_FREQUENCY_LABELS[p.frequency]}</TableCell>
                    <TableCell>{formatCurrency(p.coverageAmount)}</TableCell>
                    <TableCell className="text-muted-foreground">{p.startDate}</TableCell>
                    <TableCell className="text-muted-foreground">{p.endDate ?? "—"}</TableCell>
                  </TableRow>
                ))}
                {policies.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No policies yet.</TableCell>
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

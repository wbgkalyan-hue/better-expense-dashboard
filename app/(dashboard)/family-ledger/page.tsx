"use client"
import { useState, useMemo } from "react"
import { Plus, Heart, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/auth-context"
import { useFamilyLedger, useFamilyMembers } from "@/lib/hooks"
import { addFamilyLedgerEntry, updateFamilyLedgerEntry } from "@/lib/firestore"
import { FAMILY_LEDGER_TYPE_LABELS, type FamilyLedgerType } from "@/types"
import { toast } from "sonner"

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount)
}

export default function FamilyLedgerPage() {
  const { user } = useAuth()
  const { data: entries, loading, refetch } = useFamilyLedger()
  const { data: familyMembers } = useFamilyMembers()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const [formMemberId, setFormMemberId] = useState("")
  const [formMemberName, setFormMemberName] = useState("")
  const [formType, setFormType] = useState<FamilyLedgerType>("paid")
  const [formAmount, setFormAmount] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10))

  const totalPaid = useMemo(() => entries.filter(e => e.type === "paid" && !e.settled).reduce((s, e) => s + e.amount, 0), [entries])
  const totalReceived = useMemo(() => entries.filter(e => e.type === "received" && !e.settled).reduce((s, e) => s + e.amount, 0), [entries])
  const netPosition = totalPaid - totalReceived
  const openCount = entries.filter(e => !e.settled).length

  async function handleSave() {
    if (!user || !formAmount || !formDescription || !formDate) return
    setSaving(true)
    const selectedMember = familyMembers.find(m => m.id === formMemberId)
    try {
      await addFamilyLedgerEntry({
        userId: user.uid,
        familyMemberId: formMemberId || "unknown",
        familyMemberName: selectedMember?.name ?? formMemberName,
        type: formType,
        amount: Number(formAmount),
        description: formDescription,
        date: formDate,
        settled: false,
      })
      toast.success("Entry added")
      setDialogOpen(false)
      setFormMemberId(""); setFormMemberName(""); setFormAmount(""); setFormDescription("")
      refetch()
    } catch {
      toast.error("Failed to add entry")
    } finally {
      setSaving(false)
    }
  }

  async function handleSettle(id: string) {
    try {
      await updateFamilyLedgerEntry(id, { settled: true, settledDate: new Date().toISOString().slice(0, 10) })
      toast.success("Marked as settled")
      refetch()
    } catch {
      toast.error("Failed to update")
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
          <h1 className="text-2xl font-bold tracking-tight">Family Ledger</h1>
          <p className="text-muted-foreground">Track shared expenses and payments with family members</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Add Entry</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Ledger Entry</DialogTitle>
              <DialogDescription>Record a payment, receipt, or shared expense</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Family Member</Label>
                {familyMembers.length > 0 ? (
                  <Select value={formMemberId} onValueChange={setFormMemberId}>
                    <SelectTrigger><SelectValue placeholder="Select family member" /></SelectTrigger>
                    <SelectContent>
                      {familyMembers.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input placeholder="Family member name" value={formMemberName} onChange={e => setFormMemberName(e.target.value)} />
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-2">
                  <Label>Type</Label>
                  <Select value={formType} onValueChange={v => setFormType(v as FamilyLedgerType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(FAMILY_LEDGER_TYPE_LABELS).map(([v, l]) => (
                        <SelectItem key={v} value={v}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Amount (₹)</Label>
                  <Input type="number" placeholder="0" value={formAmount} onChange={e => setFormAmount(e.target.value)} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Description</Label>
                <Input placeholder="What for?" value={formDescription} onChange={e => setFormDescription(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Date</Label>
                <Input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving || !formAmount || !formDescription}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Net Position</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netPosition >= 0 ? "text-green-500" : "text-red-500"}`}>
              {netPosition >= 0 ? "+" : ""}{formatCurrency(netPosition)}
            </div>
            <p className="text-xs text-muted-foreground">{netPosition >= 0 ? "You are owed" : "You owe family"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Paid (Unsettled)</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-500">{formatCurrency(totalPaid)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Received (Unsettled)</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-red-500">{formatCurrency(totalReceived)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Open Entries</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{openCount}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Entries</CardTitle>
          <CardDescription>{entries.length} total entries</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Family Member</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map(e => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.familyMemberName ?? e.familyMemberId}</TableCell>
                    <TableCell>
                      <Badge variant={e.type === "paid" ? "default" : e.type === "received" ? "secondary" : "outline"}>
                        {FAMILY_LEDGER_TYPE_LABELS[e.type]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{e.description}</TableCell>
                    <TableCell className={
                      e.type === "paid" ? "text-green-500 font-semibold" :
                      e.type === "received" ? "text-red-500 font-semibold" :
                      "font-semibold"
                    }>
                      {e.type === "paid" ? "+" : e.type === "received" ? "-" : ""}{formatCurrency(e.amount)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{e.date}</TableCell>
                    <TableCell>
                      <Badge variant={e.settled ? "outline" : "destructive"}>
                        {e.settled ? "Settled" : "Open"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {!e.settled && (
                        <Button size="sm" variant="ghost" onClick={() => handleSettle(e.id)}>Settle</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {entries.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No entries yet.</TableCell>
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

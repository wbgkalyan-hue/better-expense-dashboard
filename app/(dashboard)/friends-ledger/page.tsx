"use client"
import { useState, useMemo } from "react"
import { Plus, Users, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/auth-context"
import { useFriendsLedger, useFriends } from "@/lib/hooks"
import { addFriendsLedgerEntry, updateFriendsLedgerEntry } from "@/lib/firestore"
import { LEDGER_ENTRY_TYPE_LABELS, type LedgerEntryType } from "@/types"
import { toast } from "sonner"

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount)
}

export default function FriendsLedgerPage() {
  const { user } = useAuth()
  const { data: entries, loading, refetch } = useFriendsLedger()
  const { data: friends } = useFriends()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const [formFriendId, setFormFriendId] = useState("")
  const [formFriendName, setFormFriendName] = useState("")
  const [formType, setFormType] = useState<LedgerEntryType>("lent")
  const [formAmount, setFormAmount] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10))

  const totalLent = useMemo(() => entries.filter(e => e.type === "lent" && !e.settled).reduce((s, e) => s + e.amount, 0), [entries])
  const totalBorrowed = useMemo(() => entries.filter(e => e.type === "borrowed" && !e.settled).reduce((s, e) => s + e.amount, 0), [entries])
  const netPosition = totalLent - totalBorrowed
  const openCount = entries.filter(e => !e.settled).length

  async function handleSave() {
    if (!user || !formAmount || !formDescription || !formDate) return
    setSaving(true)
    const selectedFriend = friends.find(f => f.id === formFriendId)
    try {
      await addFriendsLedgerEntry({
        userId: user.uid,
        friendId: formFriendId || "unknown",
        friendName: selectedFriend?.name ?? formFriendName,
        type: formType,
        amount: Number(formAmount),
        description: formDescription,
        date: formDate,
        settled: false,
      })
      toast.success("Entry added")
      setDialogOpen(false)
      setFormFriendId(""); setFormFriendName(""); setFormAmount(""); setFormDescription("")
      refetch()
    } catch {
      toast.error("Failed to add entry")
    } finally {
      setSaving(false)
    }
  }

  async function handleSettle(id: string) {
    try {
      await updateFriendsLedgerEntry(id, { settled: true, settledDate: new Date().toISOString().slice(0, 10) })
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
          <h1 className="text-2xl font-bold tracking-tight">Friends Ledger</h1>
          <p className="text-muted-foreground">Track money lent and borrowed with friends</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Add Entry</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Ledger Entry</DialogTitle>
              <DialogDescription>Record money lent or borrowed</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Friend</Label>
                {friends.length > 0 ? (
                  <Select value={formFriendId} onValueChange={setFormFriendId}>
                    <SelectTrigger><SelectValue placeholder="Select friend" /></SelectTrigger>
                    <SelectContent>
                      {friends.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input placeholder="Friend name" value={formFriendName} onChange={e => setFormFriendName(e.target.value)} />
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-2">
                  <Label>Type</Label>
                  <Select value={formType} onValueChange={v => setFormType(v as LedgerEntryType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(LEDGER_ENTRY_TYPE_LABELS).map(([v, l]) => (
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
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netPosition >= 0 ? "text-green-500" : "text-red-500"}`}>
              {netPosition >= 0 ? "+" : ""}{formatCurrency(netPosition)}
            </div>
            <p className="text-xs text-muted-foreground">{netPosition >= 0 ? "Others owe you" : "You owe others"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Lent (Unsettled)</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-500">{formatCurrency(totalLent)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Borrowed (Unsettled)</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-red-500">{formatCurrency(totalBorrowed)}</div></CardContent>
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
                  <TableHead>Friend</TableHead>
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
                    <TableCell className="font-medium">{e.friendName ?? e.friendId}</TableCell>
                    <TableCell>
                      <Badge variant={e.type === "lent" ? "default" : "secondary"}>
                        {LEDGER_ENTRY_TYPE_LABELS[e.type]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{e.description}</TableCell>
                    <TableCell className={e.type === "lent" ? "text-green-500 font-semibold" : "text-red-500 font-semibold"}>
                      {e.type === "lent" ? "+" : "-"}{formatCurrency(e.amount)}
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

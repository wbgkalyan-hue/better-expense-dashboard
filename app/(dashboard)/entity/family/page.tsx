"use client"
import { useState } from "react"
import { Plus, Heart, Search, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/auth-context"
import { useFamilyMembers } from "@/lib/hooks"
import { addFamilyMember } from "@/lib/firestore"
import { FAMILY_RELATIONSHIP_LABELS } from "@/types"
import { toast } from "sonner"

export default function EntityFamilyPage() {
  const { user } = useAuth()
  const { data: members, loading, refetch } = useFamilyMembers()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState("")

  const [formName, setFormName] = useState("")
  const [formRelationship, setFormRelationship] = useState("")
  const [formPhone, setFormPhone] = useState("")
  const [formEmail, setFormEmail] = useState("")
  const [formNotes, setFormNotes] = useState("")

  const filtered = members.filter(m =>
    search === "" ||
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    (m.relationship && FAMILY_RELATIONSHIP_LABELS[m.relationship]?.toLowerCase().includes(search.toLowerCase()))
  )

  async function handleSave() {
    if (!user || !formName) return
    setSaving(true)
    try {
      await addFamilyMember({
        userId: user.uid,
        name: formName,
        relationship: (formRelationship || undefined) as any,
        phone: formPhone || undefined,
        email: formEmail || undefined,
        notes: formNotes || undefined,
      })
      toast.success("Family member added")
      setDialogOpen(false)
      setFormName(""); setFormRelationship(""); setFormPhone(""); setFormEmail(""); setFormNotes("")
      refetch()
    } catch {
      toast.error("Failed to add family member")
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
          <h1 className="text-2xl font-bold tracking-tight">Family</h1>
          <p className="text-muted-foreground">Manage your family member contacts</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Add Family Member</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Family Member</DialogTitle>
              <DialogDescription>Add a family member contact (data is encrypted)</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Name</Label>
                <Input placeholder="Full name" value={formName} onChange={e => setFormName(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Relationship</Label>
                <Select value={formRelationship} onValueChange={setFormRelationship}>
                  <SelectTrigger><SelectValue placeholder="Select relationship" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(FAMILY_RELATIONSHIP_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Phone</Label>
                <Input placeholder="+91 XXXXX XXXXX" value={formPhone} onChange={e => setFormPhone(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Email</Label>
                <Input type="email" placeholder="email@example.com" value={formEmail} onChange={e => setFormEmail(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Notes</Label>
                <Input placeholder="Optional notes" value={formNotes} onChange={e => setFormNotes(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving || !formName}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Family Members</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{members.length}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <CardTitle>All Family Members</CardTitle>
              <CardDescription>{filtered.length} of {members.length} contacts</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Relationship</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(m => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell>
                      {m.relationship ? (
                        <Badge variant="secondary">{FAMILY_RELATIONSHIP_LABELS[m.relationship]}</Badge>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{m.phone ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{m.email ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{m.notes ?? "—"}</TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No family members found.</TableCell>
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

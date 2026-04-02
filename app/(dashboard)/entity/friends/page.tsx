"use client"
import { useState } from "react"
import { Plus, UserRound, Search, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/auth-context"
import { useFriends } from "@/lib/hooks"
import { addFriend } from "@/lib/firestore"
import { FRIEND_RELATIONSHIP_LABELS } from "@/types"
import { toast } from "sonner"

export default function EntityFriendsPage() {
  const { user } = useAuth()
  const { data: friends, loading, refetch } = useFriends()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState("")

  const [formName, setFormName] = useState("")
  const [formRelationship, setFormRelationship] = useState("")
  const [formPhone, setFormPhone] = useState("")
  const [formEmail, setFormEmail] = useState("")
  const [formTags, setFormTags] = useState("")
  const [formAddress, setFormAddress] = useState("")
  const [formNotes, setFormNotes] = useState("")

  const filtered = friends.filter(f =>
    search === "" || f.name.toLowerCase().includes(search.toLowerCase())
  )

  async function handleSave() {
    if (!user || !formName) return
    setSaving(true)
    try {
      const tags = formTags ? formTags.split(",").map(t => t.trim()).filter(Boolean) : undefined
      await addFriend({
        userId: user.uid,
        name: formName,
        relationship: (formRelationship || undefined) as any,
        phone: formPhone || undefined,
        email: formEmail || undefined,
        tags: tags,
        address: formAddress || undefined,
        notes: formNotes || undefined,
      })
      toast.success("Friend added")
      setDialogOpen(false)
      setFormName(""); setFormRelationship(""); setFormPhone(""); setFormEmail(""); setFormTags(""); setFormAddress(""); setFormNotes("")
      refetch()
    } catch {
      toast.error("Failed to add friend")
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
          <h1 className="text-2xl font-bold tracking-tight">Friends</h1>
          <p className="text-muted-foreground">Manage your friend contacts</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Add Friend</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Friend</DialogTitle>
              <DialogDescription>Add a friend contact (data is encrypted)</DialogDescription>
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
                    {Object.entries(FRIEND_RELATIONSHIP_LABELS).map(([v, l]) => (
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
                <Label>Tags</Label>
                <Input placeholder="Comma-separated tags (optional)" value={formTags} onChange={e => setFormTags(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Address</Label>
                <Input placeholder="Address (optional)" value={formAddress} onChange={e => setFormAddress(e.target.value)} />
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
            <CardTitle className="text-sm font-medium">Total Friends</CardTitle>
            <UserRound className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{friends.length}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <CardTitle>All Friends</CardTitle>
              <CardDescription>{filtered.length} of {friends.length} contacts</CardDescription>
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
                  <TableHead>Tags</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(f => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{f.name}</TableCell>
                    <TableCell>
                      {f.relationship ? (
                        <Badge variant="secondary">{FRIEND_RELATIONSHIP_LABELS[f.relationship]}</Badge>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{f.phone ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{f.email ?? "—"}</TableCell>
                    <TableCell>
                      {f.tags && f.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {f.tags.map((tag, i) => <Badge key={i} variant="outline">{tag}</Badge>)}
                        </div>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{f.notes ?? "—"}</TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No friends found.</TableCell>
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

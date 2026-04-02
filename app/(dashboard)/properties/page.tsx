"use client"
import { useState, useMemo } from "react"
import { Plus, Building, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/auth-context"
import { useProperties } from "@/lib/hooks"
import { addProperty } from "@/lib/firestore"
import {
  PROPERTY_TYPE_LABELS, PROPERTY_CATEGORY_LABELS,
  type PropertyType, type PropertyCategory
} from "@/types"
import { toast } from "sonner"

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount)
}

export default function PropertiesPage() {
  const { user } = useAuth()
  const { data: properties, loading, refetch } = useProperties()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const [formName, setFormName] = useState("")
  const [formAddress, setFormAddress] = useState("")
  const [formType, setFormType] = useState<PropertyType>("owned")
  const [formCategory, setFormCategory] = useState<PropertyCategory>("residential")
  const [formCurrentValue, setFormCurrentValue] = useState("")
  const [formPurchasePrice, setFormPurchasePrice] = useState("")
  const [formMonthlyRent, setFormMonthlyRent] = useState("")
  const [formMonthlyEmi, setFormMonthlyEmi] = useState("")
  const [formPurchaseDate, setFormPurchaseDate] = useState("")
  const [formNotes, setFormNotes] = useState("")

  const totalPortfolio = useMemo(
    () => properties.reduce((s, p) => s + (p.currentValue ?? 0), 0),
    [properties],
  )
  const ownedCount = properties.filter(p => p.type === "owned").length
  const totalMonthlyRent = useMemo(
    () => properties.reduce((s, p) => s + (p.monthlyRent ?? 0), 0),
    [properties],
  )

  async function handleSave() {
    if (!user || !formName) return
    setSaving(true)
    try {
      await addProperty({
        userId: user.uid,
        name: formName,
        address: formAddress || undefined,
        type: formType,
        category: formCategory,
        currentValue: formCurrentValue ? Number(formCurrentValue) : undefined,
        purchasePrice: formPurchasePrice ? Number(formPurchasePrice) : undefined,
        monthlyRent: formMonthlyRent ? Number(formMonthlyRent) : undefined,
        monthlyEmi: formMonthlyEmi ? Number(formMonthlyEmi) : undefined,
        purchaseDate: formPurchaseDate || undefined,
        notes: formNotes || undefined,
      })
      toast.success("Property added")
      setDialogOpen(false)
      setFormName(""); setFormAddress(""); setFormType("owned"); setFormCategory("residential")
      setFormCurrentValue(""); setFormPurchasePrice(""); setFormMonthlyRent("")
      setFormMonthlyEmi(""); setFormPurchaseDate(""); setFormNotes("")
      refetch()
    } catch {
      toast.error("Failed to add property")
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
          <h1 className="text-2xl font-bold tracking-tight">Properties</h1>
          <p className="text-muted-foreground">Manage your owned, rented, and leased properties</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Add Property</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Property</DialogTitle>
              <DialogDescription>Record a property you own, rent, or lease</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Property Name</Label>
                <Input placeholder="e.g. 2BHK Mumbai" value={formName} onChange={e => setFormName(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Address</Label>
                <Input placeholder="Full address (encrypted)" value={formAddress} onChange={e => setFormAddress(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-2">
                  <Label>Status</Label>
                  <Select value={formType} onValueChange={v => setFormType(v as PropertyType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(PROPERTY_TYPE_LABELS).map(([v, l]) => (
                        <SelectItem key={v} value={v}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Category</Label>
                  <Select value={formCategory} onValueChange={v => setFormCategory(v as PropertyCategory)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(PROPERTY_CATEGORY_LABELS).map(([v, l]) => (
                        <SelectItem key={v} value={v}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-2">
                  <Label>Current Value (₹)</Label>
                  <Input type="number" placeholder="Optional" value={formCurrentValue} onChange={e => setFormCurrentValue(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Purchase Price (₹)</Label>
                  <Input type="number" placeholder="Optional" value={formPurchasePrice} onChange={e => setFormPurchasePrice(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-2">
                  <Label>Monthly Rent (₹)</Label>
                  <Input type="number" placeholder="If rented out" value={formMonthlyRent} onChange={e => setFormMonthlyRent(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Monthly EMI (₹)</Label>
                  <Input type="number" placeholder="If loan on property" value={formMonthlyEmi} onChange={e => setFormMonthlyEmi(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-2">
                  <Label>Purchase Date</Label>
                  <Input type="date" value={formPurchaseDate} onChange={e => setFormPurchaseDate(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Notes</Label>
                  <Input placeholder="Optional" value={formNotes} onChange={e => setFormNotes(e.target.value)} />
                </div>
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

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatCurrency(totalPortfolio)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Owned Properties</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{ownedCount}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Monthly Rental Income</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-500">{formatCurrency(totalMonthlyRent)}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Properties</CardTitle>
          <CardDescription>{properties.length} propert{properties.length !== 1 ? "ies" : "y"}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Current Value</TableHead>
                  <TableHead>Purchase Price</TableHead>
                  <TableHead>Monthly Rent</TableHead>
                  <TableHead>Monthly EMI</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {properties.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell><Badge variant="outline">{PROPERTY_TYPE_LABELS[p.type]}</Badge></TableCell>
                    <TableCell><Badge variant="secondary">{PROPERTY_CATEGORY_LABELS[p.category]}</Badge></TableCell>
                    <TableCell>{p.currentValue ? formatCurrency(p.currentValue) : "—"}</TableCell>
                    <TableCell>{p.purchasePrice ? formatCurrency(p.purchasePrice) : "—"}</TableCell>
                    <TableCell className="text-green-500">{p.monthlyRent ? formatCurrency(p.monthlyRent) : "—"}</TableCell>
                    <TableCell className="text-red-500">{p.monthlyEmi ? formatCurrency(p.monthlyEmi) : "—"}</TableCell>
                  </TableRow>
                ))}
                {properties.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No properties yet.</TableCell>
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

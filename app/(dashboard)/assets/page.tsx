"use client"

import { useState } from "react"
import { Plus, Package, Loader2, Trash2, TrendingUp, TrendingDown } from "lucide-react"
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
import { useAssets } from "@/lib/hooks"
import { useAuth } from "@/lib/auth-context"
import { addAsset, deleteAsset } from "@/lib/firestore"
import { AssetType, ASSET_TYPE_LABELS } from "@/types/categories"
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
  property: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400",
  vehicle: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400",
  gold: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400",
  electronics: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-400",
  other: "bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-400",
}

export default function AssetsPage() {
  const { user } = useAuth()
  const { data: assets, loading } = useAssets()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const [formName, setFormName] = useState("")
  const [formType, setFormType] = useState<string>("")
  const [formCurrentValue, setFormCurrentValue] = useState("")
  const [formPurchaseValue, setFormPurchaseValue] = useState("")
  const [formPurchaseDate, setFormPurchaseDate] = useState("")
  const [formDescription, setFormDescription] = useState("")

  const totalCurrentValue = assets.reduce((s, a) => s + a.currentValue, 0)
  const totalPurchaseValue = assets.reduce((s, a) => s + a.purchaseValue, 0)
  const totalAppreciation = totalCurrentValue - totalPurchaseValue
  const appreciationPercent = totalPurchaseValue > 0 ? ((totalAppreciation / totalPurchaseValue) * 100).toFixed(1) : "0.0"

  async function handleAdd() {
    if (!user || !formName || !formType || !formCurrentValue || !formPurchaseValue) return
    setSaving(true)
    try {
      await addAsset({
        userId: user.uid,
        name: formName,
        type: formType as AssetType,
        currentValue: parseFloat(formCurrentValue),
        purchaseValue: parseFloat(formPurchaseValue),
        purchaseDate: formPurchaseDate || undefined,
        description: formDescription || undefined,
      })
      toast.success("Asset added")
      setDialogOpen(false)
      setFormName("")
      setFormType("")
      setFormCurrentValue("")
      setFormPurchaseValue("")
      setFormPurchaseDate("")
      setFormDescription("")
      window.location.reload()
    } catch {
      toast.error("Failed to add asset")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!user) return
    try {
      await deleteAsset(id)
      toast.success("Asset deleted")
      window.location.reload()
    } catch {
      toast.error("Failed to delete asset")
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Assets</h1>
            <p className="text-muted-foreground">Track your physical and valuable assets</p>
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
          <h1 className="text-2xl font-bold tracking-tight">Assets</h1>
          <p className="text-muted-foreground">
            Track your physical and valuable assets
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Add Asset</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Asset</DialogTitle>
              <DialogDescription>Track a new physical or valuable asset</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Asset Name</Label>
                <Input placeholder="e.g. Gold Chain, Honda City" value={formName} onChange={(e) => setFormName(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Type</Label>
                <CategorySelect
                  group="asset_type"
                  options={labelMapToOptions(ASSET_TYPE_LABELS)}
                  value={formType}
                  onValueChange={setFormType}
                  placeholder="Select type"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Purchase Value (₹)</Label>
                  <Input type="number" placeholder="500000" value={formPurchaseValue} onChange={(e) => setFormPurchaseValue(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Current Value (₹)</Label>
                  <Input type="number" placeholder="600000" value={formCurrentValue} onChange={(e) => setFormCurrentValue(e.target.value)} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Purchase Date — optional</Label>
                <DatePicker value={formPurchaseDate} onChange={setFormPurchaseDate} placeholder="Pick a date" />
              </div>
              <div className="grid gap-2">
                <Label>Description — optional</Label>
                <Input placeholder="Additional notes" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAdd} disabled={saving || !formName || !formType || !formCurrentValue || !formPurchaseValue}>
                {saving ? "Saving..." : "Add Asset"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Value</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatCurrency(totalCurrentValue)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Invested</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatCurrency(totalPurchaseValue)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Appreciation</CardTitle></CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold flex items-center gap-1 ${totalAppreciation >= 0 ? "text-green-600" : "text-red-500"}`}>
              {totalAppreciation >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
              {appreciationPercent}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Asset Cards */}
      {assets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Package className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No assets tracked yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Click "Add Asset" to start tracking your valuables.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assets.map((asset) => {
            const change = asset.currentValue - asset.purchaseValue
            const changePercent = asset.purchaseValue > 0 ? ((change / asset.purchaseValue) * 100).toFixed(1) : "0.0"
            return (
              <Card key={asset.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{asset.name}</CardTitle>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(asset.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {asset.description && <CardDescription>{asset.description}</CardDescription>}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(asset.currentValue)}</div>
                  <p className="text-xs text-muted-foreground">
                    Bought for {formatCurrency(asset.purchaseValue)}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge className={TYPE_COLORS[asset.type] || TYPE_COLORS.other}>
                      {(ASSET_TYPE_LABELS as Record<string, string>)[asset.type] ?? asset.type}
                    </Badge>
                    <span className={`text-xs font-medium ${change >= 0 ? "text-green-600" : "text-red-500"}`}>
                      {change >= 0 ? "+" : ""}{changePercent}%
                    </span>
                  </div>
                  {asset.purchaseDate && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Purchased: {new Date(asset.purchaseDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

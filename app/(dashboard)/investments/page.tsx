"use client"

import Link from "next/link"
import { useState } from "react"
import {
  Plus,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Briefcase,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Pie,
  PieChart,
  XAxis,
  YAxis,
  Cell,
} from "recharts"
import { useBrokerAccounts, useNetworthSnapshots } from "@/lib/hooks"
import { useAuth } from "@/lib/auth-context"
import { addBrokerAccount } from "@/lib/firestore"
import { toast } from "sonner"

const BROKER_TEMPLATES = ["Kite / Zerodha", "Groww", "Upstox", "Angel One", "Coin (SIP)", "Other"]

const ALLOC_COLORS = [
  "oklch(0.6 0.15 250)",
  "oklch(0.65 0.14 150)",
  "oklch(0.7 0.12 45)",
  "oklch(0.6 0.18 320)",
  "oklch(0.58 0.12 220)",
  "oklch(0.65 0.15 180)",
]

const trendConfig: ChartConfig = {
  value: { label: "Portfolio Value", color: "var(--chart-1)" },
}

const allocConfig: ChartConfig = {
  value: { label: "Value" },
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function InvestmentsPage() {
  const { user } = useAuth()
  const { data: brokers, loading: brkLoading } = useBrokerAccounts()
  const { data: networthSnaps, loading: nwLoading } = useNetworthSnapshots()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formName, setFormName] = useState("")
  const [formBroker, setFormBroker] = useState("")
  const [formInvested, setFormInvested] = useState("")
  const [formCurrent, setFormCurrent] = useState("")

  const loading = brkLoading || nwLoading

  const totalInvested = brokers.reduce((s, b) => s + b.totalInvested, 0)
  const currentValue = brokers.reduce((s, b) => s + b.currentValue, 0)
  const totalReturns = currentValue - totalInvested
  const totalReturnsPercent = totalInvested > 0 ? ((totalReturns / totalInvested) * 100).toFixed(1) : "0"

  // Portfolio trend from networth snapshots (totalInvestments field)
  const portfolioTrend = [...networthSnaps]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-6)
    .map((s) => ({
      month: new Date(s.date).toLocaleString("en-US", { month: "short" }),
      value: s.totalInvestments,
    }))

  // Allocation pie
  const allocationData = brokers.map((b, i) => ({
    name: b.name,
    value: b.currentValue,
    fill: ALLOC_COLORS[i % ALLOC_COLORS.length],
  }))

  async function handleAdd() {
    if (!user || !formName || !formBroker || !formInvested || !formCurrent) return
    setSaving(true)
    try {
      const invested = Number(formInvested)
      const current = Number(formCurrent)
      await addBrokerAccount({
        userId: user.uid,
        name: formName,
        broker: formBroker,
        totalInvested: invested,
        currentValue: current,
        returns: current - invested,
        returnsPercent: invested > 0 ? ((current - invested) / invested) * 100 : 0,
      })
      toast.success("Broker account added")
      setDialogOpen(false)
      setFormName("")
      setFormBroker("")
      setFormInvested("")
      setFormCurrent("")
      window.location.reload()
    } catch {
      toast.error("Failed to add broker account")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Investments</h1>
          <p className="text-muted-foreground">Track your broker accounts and portfolio</p>
        </div>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Investments</h1>
          <p className="text-muted-foreground">
            Track your broker accounts and portfolio
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Broker Account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Broker Account</DialogTitle>
              <DialogDescription>
                Add a new broker or investment platform to track
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="broker-name">Account Name</Label>
                <Input id="broker-name" placeholder="e.g. Zerodha Kite" value={formName} onChange={(e) => setFormName(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="broker">Broker</Label>
                <Select value={formBroker} onValueChange={setFormBroker}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select broker" />
                  </SelectTrigger>
                  <SelectContent>
                    {BROKER_TEMPLATES.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="invested">Total Invested (₹)</Label>
                <Input id="invested" type="number" placeholder="0" value={formInvested} onChange={(e) => setFormInvested(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="current-value">Current Value (₹)</Label>
                <Input id="current-value" type="number" placeholder="0" value={formCurrent} onChange={(e) => setFormCurrent(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAdd} disabled={saving || !formName || !formBroker || !formInvested || !formCurrent}>
                {saving ? "Adding..." : "Add Account"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Portfolio Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalInvested)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Current Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(currentValue)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Returns</CardTitle>
            {totalReturns >= 0 ? (
              <ArrowUpRight className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${totalReturns >= 0 ? "text-green-600" : "text-red-500"}`}
            >
              {totalReturns >= 0 ? "+" : ""}
              {formatCurrency(totalReturns)}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalReturnsPercent}% overall
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Portfolio Growth</CardTitle>
            <CardDescription>Total value over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            {portfolioTrend.length > 0 ? (
              <ChartContainer config={trendConfig} className="h-[280px] w-full">
                <AreaChart data={portfolioTrend} accessibilityLayer>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `₹${v / 1000}k`}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => formatCurrency(value as number)}
                      />
                    }
                  />
                  <defs>
                    <linearGradient id="fillValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-value)" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="var(--color-value)" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="var(--color-value)"
                    strokeWidth={2}
                    fill="url(#fillValue)"
                  />
                </AreaChart>
              </ChartContainer>
            ) : (
              <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
                No portfolio data yet
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Allocation</CardTitle>
            <CardDescription>Distribution across brokers</CardDescription>
          </CardHeader>
          <CardContent>
            {allocationData.length > 0 ? (
              <>
                <ChartContainer config={allocConfig} className="mx-auto h-[200px] w-full">
                  <PieChart accessibilityLayer>
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value) => formatCurrency(value as number)}
                        />
                      }
                    />
                    <Pie
                      data={allocationData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      strokeWidth={2}
                    >
                      {allocationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
                <div className="mt-4 space-y-2">
                  {allocationData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: item.fill }}
                        />
                        <span>{item.name}</span>
                      </div>
                      <span className="font-medium">{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
                No broker accounts yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Broker Account Cards */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Broker Accounts</h2>
        {brokers.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {brokers.map((broker) => (
              <Link key={broker.id} href={`/investments/${broker.id}`}>
                <Card className="transition-colors hover:bg-muted/50 cursor-pointer">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{broker.name}</CardTitle>
                      <Badge variant="outline">{broker.broker}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Invested</span>
                      <span>{formatCurrency(broker.totalInvested)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Current</span>
                      <span className="font-semibold">
                        {formatCurrency(broker.currentValue)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Returns</span>
                      <span
                        className={`font-semibold ${broker.returns >= 0 ? "text-green-600" : "text-red-500"}`}
                      >
                        {broker.returns >= 0 ? "+" : ""}
                        {formatCurrency(broker.returns)} ({broker.returnsPercent.toFixed(1)}
                        %)
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              No broker accounts yet. Add one to start tracking investments.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

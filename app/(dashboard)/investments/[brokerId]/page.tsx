"use client"

import { use } from "react"
import Link from "next/link"
import { ArrowLeft, Plus, TrendingUp, TrendingDown, Loader2 } from "lucide-react"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { useBrokerAccount, useInvestmentTransactions } from "@/lib/hooks"

const trendConfig: ChartConfig = {
  value: { label: "Value", color: "var(--chart-1)" },
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function BrokerDetailPage({
  params,
}: {
  params: Promise<{ brokerId: string }>
}) {
  const { brokerId } = use(params)
  const { data: broker, loading: brokerLoading } = useBrokerAccount(brokerId)
  const { data: transactions, loading: txLoading } = useInvestmentTransactions(brokerId)

  const loading = brokerLoading || txLoading

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!broker) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Broker account not found.</p>
      </div>
    )
  }

  // Build a simple running total trend from transactions (deposits add, withdrawals subtract)
  const sortedTx = [...transactions].sort((a, b) => a.date.localeCompare(b.date))
  const monthlyValues: Record<string, number> = {}
  let runningTotal = 0
  for (const tx of sortedTx) {
    runningTotal += tx.type === "deposit" ? tx.amount : -tx.amount
    const monthKey = new Date(tx.date).toLocaleString("en-US", { month: "short", year: "2-digit" })
    monthlyValues[monthKey] = runningTotal
  }
  const valueTrend = Object.entries(monthlyValues).map(([month, value]) => ({
    month,
    value,
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/investments">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                {broker.name}
              </h1>
              <Badge variant="outline">{broker.broker}</Badge>
            </div>
            <p className="text-muted-foreground">
              Transaction history and performance
            </p>
          </div>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(broker.totalInvested)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Current Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(broker.currentValue)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Returns</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`flex items-center gap-1 text-2xl font-bold ${broker.returns >= 0 ? "text-green-600" : "text-red-500"}`}
            >
              {broker.returns >= 0 ? (
                <TrendingUp className="h-5 w-5" />
              ) : (
                <TrendingDown className="h-5 w-5" />
              )}
              {broker.returns >= 0 ? "+" : ""}
              {formatCurrency(broker.returns)}
            </div>
            <p className="text-xs text-muted-foreground">
              {broker.returnsPercent.toFixed(1)}% overall
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Value Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Value Over Time</CardTitle>
          <CardDescription>Account value trend based on transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {valueTrend.length > 0 ? (
            <ChartContainer config={trendConfig} className="h-[280px] w-full">
              <AreaChart data={valueTrend} accessibilityLayer>
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
                  <linearGradient id="fillBrokerValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-value)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--color-value)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="var(--color-value)"
                  strokeWidth={2}
                  fill="url(#fillBrokerValue)"
                />
              </AreaChart>
            </ChartContainer>
          ) : (
            <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
              No transaction history yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            All deposits and withdrawals for this account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="text-muted-foreground">
                        {tx.date}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            tx.type === "deposit" ? "default" : "secondary"
                          }
                        >
                          {tx.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{tx.note ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {tx.source}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className={`text-right font-semibold ${tx.type === "deposit" ? "text-green-600" : "text-red-500"}`}
                      >
                        {tx.type === "deposit" ? "+" : "-"}
                        {formatCurrency(tx.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
              No transactions recorded yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

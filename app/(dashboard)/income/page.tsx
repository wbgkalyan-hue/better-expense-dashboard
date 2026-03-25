import { Wallet, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function IncomePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Income</h1>
          <p className="text-muted-foreground">
            Track your income sources and earnings
          </p>
        </div>
        <Button disabled>
          <Plus className="mr-2 h-4 w-4" />
          Add Income
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Wallet className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">Coming Soon</h3>
          <p className="mt-1 text-sm text-muted-foreground text-center max-w-sm">
            Income tracking with salary, freelance, business, and other income
            sources will be available in the next update.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

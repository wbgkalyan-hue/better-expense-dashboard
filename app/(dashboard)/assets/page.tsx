import { Package, Plus } from "lucide-react"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function AssetsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Assets</h1>
          <p className="text-muted-foreground">
            Track your physical and valuable assets
          </p>
        </div>
        <Button disabled>
          <Plus className="mr-2 h-4 w-4" />
          Add Asset
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Package className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">Coming Soon</h3>
          <p className="mt-1 text-sm text-muted-foreground text-center max-w-sm">
            Asset tracking for property, vehicles, gold, electronics, and other
            valuables will be available in the next update.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

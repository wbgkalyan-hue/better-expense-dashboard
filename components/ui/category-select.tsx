"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { useCustomCategories } from "@/lib/hooks"
import { addCustomCategory } from "@/lib/firestore"
import type { CategoryGroup } from "@/types"
import { toast } from "sonner"

/** Label → value pair for predefined options. */
interface CategoryOption {
  value: string
  label: string
}

interface CategorySelectProps {
  /** Which category group for fetching/saving custom options. */
  group: CategoryGroup
  /** Predefined options from the label map. */
  options: CategoryOption[]
  /** Current value. */
  value: string
  /** Called when the value changes. */
  onValueChange: (value: string) => void
  /** Placeholder text for the select trigger. */
  placeholder?: string
}

function slugify(label: string): string {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
}

export function CategorySelect({
  group,
  options,
  value,
  onValueChange,
  placeholder = "Select option",
}: CategorySelectProps) {
  const { user } = useAuth()
  const { data: customCategories, refetch } = useCustomCategories(group)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [customLabel, setCustomLabel] = useState("")
  const [saving, setSaving] = useState(false)

  async function handleAddCustom() {
    if (!user || !customLabel.trim()) return
    const slug = slugify(customLabel)

    // Check for duplicates among predefined and custom
    const allValues = [
      ...options.map((o) => o.value),
      ...customCategories.map((c) => c.value),
    ]
    if (allValues.includes(slug)) {
      toast.error("A category with this name already exists")
      return
    }

    setSaving(true)
    try {
      await addCustomCategory({
        userId: user.uid,
        group,
        label: customLabel.trim(),
        value: slug,
      })
      toast.success("Custom category added")
      setAddDialogOpen(false)
      setCustomLabel("")
      onValueChange(slug)
      refetch()
    } catch {
      toast.error("Failed to add custom category")
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Select
        value={value}
        onValueChange={(val) => {
          if (val === "__add_custom__") {
            setAddDialogOpen(true)
          } else {
            onValueChange(val)
          }
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
          {customCategories.map((cc) => (
            <SelectItem key={cc.id} value={cc.value}>
              {cc.label}
            </SelectItem>
          ))}
          <SelectItem value="__add_custom__">
            <span className="flex items-center gap-1 text-primary">
              <Plus className="h-3 w-3" />
              Add Custom…
            </span>
          </SelectItem>
        </SelectContent>
      </Select>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Custom Category</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Category Name</Label>
              <Input
                placeholder="e.g. Pet Supplies"
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddCustom()
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCustom} disabled={saving || !customLabel.trim()}>
              {saving ? "Saving…" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

/**
 * Helper to build `options` array from a Record-style label map.
 *
 * @example
 * ```ts
 * const opts = labelMapToOptions(EXPENSE_CATEGORY_LABELS)
 * ```
 */
export function labelMapToOptions(
  labels: Record<string, string>,
): CategoryOption[] {
  return Object.entries(labels).map(([value, label]) => ({ value, label }))
}

/**
 * Look up a display label for any category value.
 * Checks predefined labels first, then custom categories, then falls back
 * to title-casing the slug.
 */
export function getCategoryLabel(
  value: string,
  predefinedLabels: Record<string, string>,
  customCategories: Array<{ value: string; label: string }>,
): string {
  if (value in predefinedLabels) return predefinedLabels[value]
  const custom = customCategories.find((c) => c.value === value)
  if (custom) return custom.label
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase())
}

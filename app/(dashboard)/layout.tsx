"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  Receipt,
  TrendingUp,
  Target,
  Wallet,
  Landmark,
  Package,
  Settings,
  LogOut,
  ChevronUp,
  ChevronDown,
  Flag,
  Building2,
  Shield,
  CreditCard,
  Banknote,
  Users,
  Handshake,
  UserRound,
  Building,
  LayoutDashboard,
} from "lucide-react"
import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"

const NAV_MAIN = [
  { title: "Dashboard",    href: "/",            icon: Home },
  { title: "Goals",        href: "/goals",       icon: Flag },
  { title: "Accounts",     href: "/bank",        icon: Landmark },
  { title: "Transactions", href: "/expenses",    icon: Receipt },
  { title: "Investment",   href: "/investments", icon: TrendingUp },
]

const NAV_FINANCE = [
  { title: "RE-Investments", href: "/re-investments", icon: Building2 },
  { title: "Insurance",      href: "/insurance",      icon: Shield },
  { title: "Credit Card",    href: "/credit-cards",   icon: CreditCard },
  { title: "Loan",           href: "/loans",          icon: Banknote },
]

const NAV_SOCIAL = [
  { title: "Friends Ledger",  href: "/friends-ledger",  icon: Users },
  { title: "Family Ledger",   href: "/family-ledger",   icon: Handshake },
]

const NAV_ENTITY = [
  { title: "Friends",  href: "/entity/friends",  icon: UserRound },
  { title: "Family",   href: "/entity/family",   icon: Handshake },
]

const NAV_MORE = [
  { title: "Income",      href: "/income",    icon: Wallet },
  { title: "Assets",      href: "/assets",    icon: Package },
  { title: "Properties",  href: "/properties", icon: Building },
  { title: "Settings",    href: "/settings",  icon: Settings },
]

function NavGroup({
  label,
  items,
  pathname,
}: {
  label: string
  items: { title: string; href: string; icon: React.ElementType }[]
  pathname: string
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href)
                }
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

function AppSidebar() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const [entityOpen, setEntityOpen] = useState(pathname.startsWith("/entity"))

  const initials = user?.displayName
    ? (user.displayName as string)
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
    : user?.email?.charAt(0).toUpperCase() ?? "U"

  function handleSignOut() {
    document.cookie = "__session=; path=/; max-age=0"
    signOut()
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Wallet className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">BetterExpenses</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Finance Tracker
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavGroup label="Main" items={NAV_MAIN} pathname={pathname} />
        <NavGroup label="Finance" items={NAV_FINANCE} pathname={pathname} />
        <NavGroup label="Ledger" items={NAV_SOCIAL} pathname={pathname} />

        {/* Entity — collapsible */}
        <SidebarGroup>
          <SidebarGroupLabel
            className="flex cursor-pointer items-center justify-between"
            onClick={() => setEntityOpen((o) => !o)}
          >
            <span>Entity</span>
            {entityOpen ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </SidebarGroupLabel>
          {entityOpen && (
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV_ENTITY.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname.startsWith(item.href)}
                    >
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          )}
        </SidebarGroup>

        <NavGroup label="More" items={NAV_MORE} pathname={pathname} />
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {user?.displayName ?? "User"}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user?.email}
                    </span>
                  </div>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 size-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 size-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}

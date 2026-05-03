"use client"

import Link from "next/link"
import {
  BriefcaseBusiness,
  CalendarClock,
  CheckSquare2,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
} from "lucide-react"

import { type User } from "@/lib/api"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/tasks", label: "Tasks", icon: CheckSquare2 },
  { href: "/overdue", label: "Overdue", icon: CalendarClock },
] as const

export function AppSidebar({
  pathname,
  user,
  onLogout,
}: {
  pathname: string
  user: User
  onLogout: () => void
}) {
  return (
    <aside className="flex h-full w-full flex-col border-r bg-sidebar text-sidebar-foreground">
      <div className="border-b p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <BriefcaseBusiness className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">Ethara Tasks</p>
            <p className="truncate text-xs text-muted-foreground">Project workspace</p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-3">
        <p className="px-2 pb-2 text-xs font-medium text-muted-foreground">Navigation</p>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                pathname === item.href && "bg-sidebar-accent text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="size-4" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>

      <div className="border-t p-4">
        <div className="flex items-start gap-3 rounded-lg border bg-background p-3">
          <div className="flex size-9 items-center justify-center rounded-md bg-muted">
            <ShieldCheck className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            <Badge className="mt-2">{user.role}</Badge>
          </div>
        </div>
        <Button variant="ghost" className="mt-3 w-full justify-start" onClick={onLogout}>
          <LogOut className="size-4" />
          Logout
        </Button>
      </div>
    </aside>
  )
}

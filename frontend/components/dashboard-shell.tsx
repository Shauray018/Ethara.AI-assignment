"use client"

import { LoaderCircle } from "lucide-react"
import { usePathname } from "next/navigation"

import { AppHeaderActions } from "@/components/app-header-actions"
import { AppSidebar } from "@/components/app-sidebar"
import { useWorkspace } from "@/components/workspace-provider"
import { Button } from "@/components/ui/button"

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { auth, logout, ready, loading } = useWorkspace()

  if (!ready || loading.initializing || !auth) {
    return (
      <div className="grid min-h-screen place-items-center bg-muted/30">
        <div className="flex items-center gap-3 rounded-lg border bg-background px-4 py-3 text-sm text-muted-foreground">
          <LoaderCircle className="size-4 animate-spin" />
          Loading workspace...
        </div>
      </div>
    )
  }

  const mobileLinks = [
    { href: "/dashboard", label: "dashboard" },
    { href: "/projects", label: "projects" },
    { href: "/tasks", label: "tasks" },
    { href: "/overdue", label: "overdue" },
  ]

  return (
    <main className="min-h-screen bg-muted/30">
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
        <div className="hidden lg:block">
          <AppSidebar pathname={pathname} user={auth.user} onLogout={logout} />
        </div>

        <div className="flex min-h-screen flex-col">
          <header className="border-b bg-background">
            <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="py-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {loading.syncing ? (
                    <span className="inline-flex items-center gap-1">
                      <LoaderCircle className="size-3 animate-spin" />
                      Syncing
                    </span>
                  ) : null}
                </div>
                <h1 className="text-xl font-semibold tracking-tight">
                  Project management dashboard
                </h1>
              </div>
              <AppHeaderActions />
            </div>
          </header>

          <div className="border-b bg-background px-4 py-3 lg:hidden">
            <div className="flex gap-2 overflow-x-auto">
              {mobileLinks.map((item) => (
                <Button
                  key={item.href}
                  asChild
                  variant={pathname === item.href ? "default" : "outline"}
                  size="sm"
                >
                  <a href={item.href}>{item.label}</a>
                </Button>
              ))}
            </div>
          </div>

          <div className="flex-1 p-4 sm:p-6">{children}</div>
        </div>
      </div>
    </main>
  )
}

"use client"

import { useEffect, type ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"

import { useWorkspaceStore } from "@/lib/workspace-store"

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const auth = useWorkspaceStore((state) => state.auth)
  const ready = useWorkspaceStore((state) => state.ready)
  const initialize = useWorkspaceStore((state) => state.initialize)

  useEffect(() => {
    void initialize()
  }, [initialize])

  useEffect(() => {
    if (!ready) {
      return
    }

    if (!auth && pathname !== "/") {
      router.replace("/")
      return
    }

    if (auth && pathname === "/") {
      router.replace("/dashboard")
    }
  }, [auth, pathname, ready, router])

  return <>{children}</>
}

export function useWorkspace() {
  return useWorkspaceStore()
}

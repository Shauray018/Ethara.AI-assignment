"use client"

import { FormEvent, useState } from "react"
import { CalendarClock, FolderKanban, LoaderCircle, ShieldCheck } from "lucide-react"

import { type Role } from "@/lib/api"
import { useWorkspace } from "@/components/workspace-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function AuthScreen() {
  const { login, signup, loading, ready } = useWorkspace()
  const [mode, setMode] = useState<"login" | "signup">("login")
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "MEMBER" as Role,
  })

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (mode === "login") {
      await login({ email: form.email, password: form.password })
      return
    }

    await signup(form)
  }

  if (!ready || loading.initializing) {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-4 py-10">
        <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground">
          <LoaderCircle className="size-4 animate-spin" />
          Checking saved session...
        </div>
      </main>
    )
  }

  const isSubmitting = loading.authenticating

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 py-10">
      <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1fr_420px]">
        <section className="hidden border bg-card p-10 lg:block">
          <Badge className="mb-4">Ethara Assignment</Badge>
          <h1 className="max-w-xl text-4xl font-semibold tracking-tight">
            Team projects, task assignment, and role-based control.
          </h1>
          <p className="mt-4 max-w-xl text-sm text-muted-foreground">
            Signup or login to manage projects, assign tasks, and monitor overdue work from a structured dashboard.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <FeatureTile
              icon={ShieldCheck}
              title="RBAC"
              description="Admin and member permissions enforced from API to UI."
            />
            <FeatureTile
              icon={FolderKanban}
              title="Projects"
              description="Keep ownership, members, and delivery scope in one place."
            />
            <FeatureTile
              icon={CalendarClock}
              title="Deadlines"
              description="Surface task progress and overdue work immediately."
            />
          </div>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>{mode === "login" ? "Login" : "Create account"}</CardTitle>
            <CardDescription>
              Connect to the Express and Prisma backend with JWT authentication.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form className="space-y-4" onSubmit={handleSubmit}>
              {mode === "signup" ? (
                <Field label="Name" htmlFor="name">
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, name: event.target.value }))
                    }
                  />
                </Field>
              ) : null}

              <Field label="Email" htmlFor="email">
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, email: event.target.value }))
                  }
                />
              </Field>

              <Field label="Password" htmlFor="password">
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, password: event.target.value }))
                  }
                />
              </Field>

              {mode === "signup" ? (
                <Field label="Role" htmlFor="role">
                  <Select
                    value={form.role}
                    onValueChange={(value) =>
                      setForm((current) => ({ ...current, role: value as Role }))
                    }
                  >
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MEMBER">Member</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              ) : null}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : null}
                {mode === "login" ? "Login" : "Create account"}
              </Button>
            </form>

            <Button
              variant="ghost"
              className="w-full"
              disabled={isSubmitting}
              onClick={() =>
                setMode((current) => (current === "login" ? "signup" : "login"))
              }
            >
              {mode === "login" ? "Need an account? Signup" : "Already have an account? Login"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  )
}

function FeatureTile({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof FolderKanban
  title: string
  description: string
}) {
  return (
    <div className="border p-4">
      <Icon className="mb-3 size-4 text-muted-foreground" />
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

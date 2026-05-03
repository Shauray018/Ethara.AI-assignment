"use client"

import { AlertCircle, BriefcaseBusiness, CheckCircle2, ShieldCheck } from "lucide-react"

import { useWorkspace } from "@/components/workspace-provider"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"

const statusOptions = [
  { value: "TODO", label: "To do" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "DONE", label: "Done" },
] as const

export default function DashboardPage() {
  const { auth, dashboard, loading } = useWorkspace()

  if (loading.workspace && !dashboard) {
    return (
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="space-y-3 p-6">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card>
            <CardHeader className="space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-56" />
            </CardHeader>
            <CardContent className="space-y-5">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-2 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-56" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-20 w-full" />
              ))}
            </CardContent>
          </Card>
        </section>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={BriefcaseBusiness}
          label="Projects"
          value={dashboard?.summary.projects ?? 0}
          caption="Visible within your role scope"
        />
        <StatCard
          icon={CheckCircle2}
          label="Tasks"
          value={dashboard?.summary.tasks ?? 0}
          caption="Tracked across your workspace"
        />
        <StatCard
          icon={AlertCircle}
          label="Overdue"
          value={dashboard?.summary.overdue ?? 0}
          caption="Open items beyond due date"
        />
        <StatCard
          icon={ShieldCheck}
          label="Role"
          value={auth?.user.role ?? "-"}
          caption="Permission-aware interface"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Status overview</CardTitle>
            <CardDescription>Task volume grouped by current status.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {statusOptions.map((status) => {
              const value = dashboard?.summary.statusCounts[status.value] ?? 0
              const total = dashboard?.summary.tasks ?? 0
              const rate = total ? Math.round((value / total) * 100) : 0

              return (
                <div key={status.value} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>{status.label}</span>
                    <span className="font-medium">{value}</span>
                  </div>
                  <Progress value={rate} />
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>Latest task updates across accessible projects.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {dashboard?.recentTasks.length ? (
              dashboard.recentTasks.map((task) => (
                <div key={task.id} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{task.title}</p>
                    <Badge className="bg-secondary text-secondary-foreground">
                      {task.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {task.project?.name} {task.assignee?.name ? `· ${task.assignee.name}` : ""}
                  </p>
                </div>
              ))
            ) : (
              <EmptyState text="No recent task activity yet." />
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  caption,
}: {
  icon: typeof BriefcaseBusiness
  label: string
  value: number | string
  caption: string
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between p-6">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
          <p className="mt-2 text-sm text-muted-foreground">{caption}</p>
        </div>
        <div className="rounded-md border p-2">
          <Icon className="size-4" />
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">{text}</div>
}

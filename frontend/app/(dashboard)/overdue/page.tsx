"use client"

import { useWorkspace } from "@/components/workspace-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDateTime } from "@/lib/workspace"

export default function OverduePage() {
  const { dashboard, loading } = useWorkspace()

  if (loading.workspace && !dashboard) {
    return (
      <Card>
        <CardHeader className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Overdue tasks</CardTitle>
        <CardDescription>Tasks that have missed their due date and are still open.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {dashboard?.overdueTasks.length ? (
          dashboard.overdueTasks.map((task) => (
            <div key={task.id} className="rounded-lg border border-destructive/20 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{task.title}</p>
                <Badge className="bg-secondary text-secondary-foreground">
                  {task.status.replace("_", " ")}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {task.project?.name} · due {formatDateTime(task.dueDate)}
              </p>
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
            No overdue tasks. Current deadlines are under control.
          </div>
        )}
      </CardContent>
    </Card>
  )
}

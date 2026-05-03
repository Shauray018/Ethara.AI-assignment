"use client"

import { FileX, LoaderCircle } from "lucide-react"

import { type Project, type TaskStatus } from "@/lib/api"
import { formatDateTime } from "@/lib/workspace"
import { TaskEditDialog } from "@/components/task-edit-dialog"
import { useWorkspace } from "@/components/workspace-provider"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const statusOptions: Array<{ value: TaskStatus; label: string }> = [
  { value: "TODO", label: "To do" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "DONE", label: "Done" },
]

type TaskRow = Project["tasks"][number] & {
  projectName: string
}

export function TasksTable({
  tasks,
  loading = false,
}: {
  tasks: TaskRow[]
  loading?: boolean
}) {
  const { auth, updateTaskStatus, loading: workspaceLoading } = useWorkspace()
  const isAdmin = auth?.user.role === "ADMIN"

  if (loading && !tasks.length) {
    return (
      <>
        <div className="space-y-3 md:hidden">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="space-y-3 p-4">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-9 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="hidden rounded-md border md:block">
          <div className="space-y-4 p-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </>
    )
  }

  if (!tasks.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <FileX className="mb-3 size-12" />
        <p className="text-lg font-medium">No tasks found</p>
        <p className="text-sm">Create a task to start tracking progress.</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3 md:hidden">
        {tasks.map((task) => (
          <Card key={task.id}>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{task.title}</p>
                    <p className="text-xs text-muted-foreground">{task.projectName}</p>
                  </div>
                  <StatusBadge status={task.status} />
                </div>
                <p className="text-sm text-muted-foreground">
                  {task.assignee?.name ?? "Unassigned"} · {formatDateTime(task.dueDate)}
                </p>
                <Select
                  value={task.status}
                  onValueChange={(value) => updateTaskStatus(task.id, value as TaskStatus)}
                  disabled={workspaceLoading.updatingTaskIds.includes(task.id)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {workspaceLoading.updatingTaskIds.includes(task.id) ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <LoaderCircle className="size-3 animate-spin" />
                    Saving status...
                  </div>
                ) : null}
                {isAdmin ? (
                  <div className="flex justify-end">
                    <TaskEditDialog task={task} />
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="hidden rounded-md border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Assignee</TableHead>
              <TableHead>Due date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell className="font-medium">{task.title}</TableCell>
                <TableCell>{task.projectName}</TableCell>
                <TableCell>{task.assignee?.name ?? "Unassigned"}</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDateTime(task.dueDate)}
                </TableCell>
                <TableCell>
                  <StatusBadge status={task.status} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {isAdmin ? <TaskEditDialog task={task} /> : null}
                    <Select
                      value={task.status}
                      onValueChange={(value) =>
                        updateTaskStatus(task.id, value as TaskStatus)
                      }
                      disabled={workspaceLoading.updatingTaskIds.includes(task.id)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {workspaceLoading.updatingTaskIds.includes(task.id) ? (
                      <LoaderCircle className="ml-2 size-4 animate-spin text-muted-foreground" />
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  )
}

function StatusBadge({ status }: { status: TaskStatus }) {
  return <Badge className="bg-secondary text-secondary-foreground">{status.replace("_", " ")}</Badge>
}

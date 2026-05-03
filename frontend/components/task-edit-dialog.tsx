"use client"

import { LoaderCircle, Pencil } from "lucide-react"
import { useMemo, useState } from "react"

import { type Project, type TaskStatus } from "@/lib/api"
import { useWorkspace } from "@/components/workspace-provider"
import { DatePickerField } from "@/components/date-picker-field"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

const statusOptions: Array<{ value: TaskStatus; label: string }> = [
  { value: "TODO", label: "To do" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "DONE", label: "Done" },
]

type TaskRow = Project["tasks"][number] & {
  projectName: string
}

export function TaskEditDialog({ task }: { task: TaskRow }) {
  const { projects, updateTask, loading } = useWorkspace()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(() => createTaskForm(task))

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === form.projectId),
    [form.projectId, projects],
  )

  const assignableMembers = useMemo(() => {
    if (!selectedProject) {
      return []
    }

    const options = [selectedProject.owner, ...selectedProject.members.map((member) => member.user)]
    return options.filter(
      (member, index) => options.findIndex((option) => option.id === member.id) === index,
    )
  }, [selectedProject])

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)

    if (nextOpen) {
      setForm(createTaskForm(task))
    }
  }

  async function handleSubmit() {
    const updated = await updateTask({
      taskId: task.id,
      title: form.title,
      description: form.description,
      projectId: form.projectId,
      assigneeId: form.assigneeId || undefined,
      dueDate: form.dueDate,
      status: form.status,
    })

    if (updated) {
      setOpen(false)
    }
  }

  const isSaving = loading.updatingTaskIds.includes(task.id)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Edit ${task.title}`}>
          <Pencil className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit task</DialogTitle>
          <DialogDescription>Update title, project, assignee, deadline, and status.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Field label="Task title" htmlFor={`task-title-${task.id}`}>
            <Input
              id={`task-title-${task.id}`}
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({ ...current, title: event.target.value }))
              }
            />
          </Field>

          <Field label="Description" htmlFor={`task-description-${task.id}`}>
            <Textarea
              id={`task-description-${task.id}`}
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
            />
          </Field>

          <Field label="Project" htmlFor={`task-project-${task.id}`}>
            <Select
              value={form.projectId}
              onValueChange={(value) =>
                setForm((current) => ({
                  ...current,
                  projectId: value,
                  assigneeId: "",
                }))
              }
            >
              <SelectTrigger id={`task-project-${task.id}`}>
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Assignee" htmlFor={`task-assignee-${task.id}`}>
              <Select
                value={form.assigneeId || "unassigned"}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    assigneeId: value === "unassigned" ? "" : value,
                  }))
                }
              >
                <SelectTrigger id={`task-assignee-${task.id}`}>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {assignableMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Status" htmlFor={`task-status-${task.id}`}>
              <Select
                value={form.status}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    status: value as TaskStatus,
                  }))
                }
              >
                <SelectTrigger id={`task-status-${task.id}`}>
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
            </Field>
          </div>

          <Field label="Due date" htmlFor={`task-due-${task.id}`}>
            <DatePickerField
              id={`task-due-${task.id}`}
              date={form.dueDate}
              onDateChange={(date) =>
                setForm((current) => ({ ...current, dueDate: date }))
              }
            />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button disabled={isSaving} onClick={handleSubmit}>
            {isSaving ? <LoaderCircle className="size-4 animate-spin" /> : null}
            Save task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function createTaskForm(task: TaskRow) {
  return {
    title: task.title,
    description: task.description ?? "",
    projectId: task.project?.id ?? "",
    assigneeId: task.assignee?.id ?? "",
    dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
    status: task.status,
  }
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

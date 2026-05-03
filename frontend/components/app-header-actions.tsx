"use client"

import { format } from "date-fns"
import { Calendar as CalendarIcon, LoaderCircle, Plus } from "lucide-react"
import { useState } from "react"

import { useWorkspace } from "@/components/workspace-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogClose,
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
import { type TaskStatus } from "@/lib/api"

const statusOptions: Array<{ value: TaskStatus; label: string }> = [
  { value: "TODO", label: "To do" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "DONE", label: "Done" },
]

export function AppHeaderActions() {
  const { auth, loading, members, projects, createProject, createTask } = useWorkspace()
  const [projectDialogOpen, setProjectDialogOpen] = useState(false)
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const [projectForm, setProjectForm] = useState({
    name: "",
    description: "",
    dueDate: undefined as Date | undefined,
    memberIds: [] as string[],
  })
  const [taskForm, setTaskForm] = useState({
    projectId: projects[0]?.id ?? "",
    title: "",
    description: "",
    assigneeId: "",
    dueDate: undefined as Date | undefined,
    status: "TODO" as TaskStatus,
  })

  const activeProjectId = taskForm.projectId || projects[0]?.id || ""
  const selectedProject = projects.find((project) => project.id === activeProjectId)

  async function submitProject() {
    const created = await createProject(projectForm)

    if (!created) {
      return
    }

    setProjectForm({
      name: "",
      description: "",
      dueDate: undefined,
      memberIds: [],
    })
    setProjectDialogOpen(false)
  }

  async function submitTask() {
    if (!activeProjectId) {
      return
    }

    const created = await createTask({
      ...taskForm,
      projectId: activeProjectId,
    })

    if (!created) {
      return
    }

    setTaskForm((current) => ({
      ...current,
      projectId: activeProjectId,
      title: "",
      description: "",
      assigneeId: "",
      dueDate: undefined,
      status: "TODO",
    }))
    setTaskDialogOpen(false)
  }

  if (!auth) {
    return null
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge>{auth.user.role}</Badge>
      <Badge className="hidden sm:inline-flex bg-secondary text-secondary-foreground">
        {auth.user.email}
      </Badge>

      <Dialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen}>
        <DialogTrigger asChild>
          <Button disabled={auth.user.role !== "ADMIN"}>
            <Plus className="size-4" />
            New project
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create project</DialogTitle>
            <DialogDescription>Create a project and attach members.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Field label="Project name" htmlFor="project-name">
              <Input
                id="project-name"
                value={projectForm.name}
                onChange={(event) =>
                  setProjectForm((current) => ({ ...current, name: event.target.value }))
                }
              />
            </Field>
            <Field label="Description" htmlFor="project-description">
              <Textarea
                id="project-description"
                value={projectForm.description}
                onChange={(event) =>
                  setProjectForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
              />
            </Field>
            <Field label="Due date" htmlFor="project-due-date">
              <DateField
                id="project-due-date"
                date={projectForm.dueDate}
                onDateChange={(date) =>
                  setProjectForm((current) => ({ ...current, dueDate: date }))
                }
              />
            </Field>
            <Field label="Members" htmlFor="project-members">
              <div className="space-y-2 rounded-md border p-3">
                {members.map((member) => {
                  const checked = projectForm.memberIds.includes(member.id)
                  return (
                    <label
                      key={member.id}
                      className="flex items-center justify-between gap-3 rounded-md px-2 py-2 text-sm hover:bg-muted"
                    >
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {member.email} ({member.role})
                        </p>
                      </div>
                      <input
                        id="project-members"
                        type="checkbox"
                        checked={checked}
                        onChange={(event) =>
                          setProjectForm((current) => ({
                            ...current,
                            memberIds: event.target.checked
                              ? [...current.memberIds, member.id]
                              : current.memberIds.filter((id) => id !== member.id),
                          }))
                        }
                      />
                    </label>
                  )
                })}
              </div>
            </Field>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              disabled={loading.creatingProject || auth.user.role !== "ADMIN"}
              onClick={submitProject}
            >
              {loading.creatingProject ? <LoaderCircle className="size-4 animate-spin" /> : null}
              Create project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <Plus className="size-4" />
            New task
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create task</DialogTitle>
            <DialogDescription>Create a task and assign it to a project member.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Field label="Project" htmlFor="task-project">
              <Select
                value={activeProjectId}
                onValueChange={(value) =>
                  setTaskForm((current) => ({ ...current, projectId: value }))
                }
              >
                <SelectTrigger id="task-project">
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
            <Field label="Task title" htmlFor="task-title">
              <Input
                id="task-title"
                value={taskForm.title}
                onChange={(event) =>
                  setTaskForm((current) => ({ ...current, title: event.target.value }))
                }
              />
            </Field>
            <Field label="Description" htmlFor="task-description">
              <Textarea
                id="task-description"
                value={taskForm.description}
                onChange={(event) =>
                  setTaskForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Assignee" htmlFor="task-assignee">
                <Select
                  value={taskForm.assigneeId}
                  onValueChange={(value) =>
                    setTaskForm((current) => ({
                      ...current,
                      assigneeId: value === "unassigned" ? "" : value,
                    }))
                  }
                >
                  <SelectTrigger id="task-assignee">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {selectedProject?.owner ? (
                      <SelectItem value={selectedProject.owner.id}>
                        {selectedProject.owner.name} (Owner)
                      </SelectItem>
                    ) : null}
                    {selectedProject?.members.map((member) => (
                      <SelectItem key={member.user.id} value={member.user.id}>
                        {member.user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Status" htmlFor="task-status">
                <Select
                  value={taskForm.status}
                  onValueChange={(value) =>
                    setTaskForm((current) => ({
                      ...current,
                      status: value as TaskStatus,
                    }))
                  }
                >
                  <SelectTrigger id="task-status">
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
            <Field label="Due date" htmlFor="task-due-date">
              <DateField
                id="task-due-date"
                date={taskForm.dueDate}
                onDateChange={(date) =>
                  setTaskForm((current) => ({ ...current, dueDate: date }))
                }
              />
            </Field>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button disabled={loading.creatingTask} onClick={submitTask}>
              {loading.creatingTask ? <LoaderCircle className="size-4 animate-spin" /> : null}
              Create task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
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

function DateField({
  id,
  date,
  onDateChange,
}: {
  id: string
  date?: Date
  onDateChange: (date: Date | undefined) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="flex gap-2">
        <DialogTrigger asChild>
          <Button id={id} type="button" variant="outline" className="flex-1 justify-start">
            <CalendarIcon className="size-4" />
            {date ? format(date, "PPP") : "Pick a date"}
          </Button>
        </DialogTrigger>
        <Button type="button" variant="outline" onClick={() => onDateChange(undefined)}>
          Clear
        </Button>
      </div>
      <DialogContent className="w-auto max-w-none p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(selected) => {
            onDateChange(selected)
            setOpen(false)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}

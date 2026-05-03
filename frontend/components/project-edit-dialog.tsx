"use client"

import { LoaderCircle, Pencil } from "lucide-react"
import { useMemo, useState } from "react"

import { type Project } from "@/lib/api"
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

export function ProjectEditDialog({ project }: { project: Project }) {
  const { members, updateProject, loading } = useWorkspace()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(() => createProjectForm(project))

  const projectMemberIds = useMemo(
    () => new Set(project.members.map((member) => member.user.id)),
    [project.members],
  )

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)

    if (nextOpen) {
      setForm(createProjectForm(project))
    }
  }

  async function handleSubmit() {
    const updated = await updateProject({
      projectId: project.id,
      name: form.name,
      description: form.description,
      dueDate: form.dueDate,
      ownerId: form.ownerId,
      memberIds: form.memberIds,
    })

    if (updated) {
      setOpen(false)
    }
  }

  const isSaving = loading.updatingProjectIds.includes(project.id)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Edit ${project.name}`}>
          <Pencil className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit project</DialogTitle>
          <DialogDescription>Update name, owner, members, and deadline.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Field label="Project name" htmlFor={`project-name-${project.id}`}>
            <Input
              id={`project-name-${project.id}`}
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
            />
          </Field>

          <Field label="Description" htmlFor={`project-description-${project.id}`}>
            <Textarea
              id={`project-description-${project.id}`}
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
            />
          </Field>

          <Field label="Owner" htmlFor={`project-owner-${project.id}`}>
            <Select
              value={form.ownerId}
              onValueChange={(value) =>
                setForm((current) => ({
                  ...current,
                  ownerId: value,
                  memberIds: current.memberIds.filter((id) => id !== value),
                }))
              }
            >
              <SelectTrigger id={`project-owner-${project.id}`}>
                <SelectValue placeholder="Select owner" />
              </SelectTrigger>
              <SelectContent>
                {members.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Due date" htmlFor={`project-due-${project.id}`}>
            <DatePickerField
              id={`project-due-${project.id}`}
              date={form.dueDate}
              onDateChange={(date) =>
                setForm((current) => ({ ...current, dueDate: date }))
              }
            />
          </Field>

          <Field label="Members" htmlFor={`project-members-${project.id}`}>
            <div className="space-y-2 rounded-md border p-3">
              {members.map((member) => {
                const isOwner = member.id === form.ownerId
                const checked = form.memberIds.includes(member.id)

                return (
                  <label
                    key={member.id}
                    className="flex items-start justify-between gap-3 rounded-md px-2 py-2 text-sm hover:bg-muted"
                  >
                    <div className="min-w-0 flex-1 text-left">
                      <p className="font-medium">
                        {member.name}
                        {isOwner ? " (Owner)" : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {member.email}
                        {projectMemberIds.has(member.id) && !isOwner ? " · Current member" : ""}
                      </p>
                    </div>
                    <input
                      id={`project-members-${project.id}`}
                      type="checkbox"
                      disabled={isOwner}
                      checked={isOwner || checked}
                      onChange={(event) =>
                        setForm((current) => ({
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
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button disabled={isSaving} onClick={handleSubmit}>
            {isSaving ? <LoaderCircle className="size-4 animate-spin" /> : null}
            Save project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function createProjectForm(project: Project) {
  return {
    name: project.name,
    description: project.description ?? "",
    dueDate: project.dueDate ? new Date(project.dueDate) : undefined,
    ownerId: project.owner.id,
    memberIds: project.members.map((member) => member.user.id),
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

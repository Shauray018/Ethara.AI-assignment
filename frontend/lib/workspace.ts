import { type Project } from "@/lib/api"

export function completionRate(project: Project) {
  if (!project.tasks.length) {
    return 0
  }

  const doneCount = project.tasks.filter((task) => task.status === "DONE").length
  return Math.round((doneCount / project.tasks.length) * 100)
}

export function toDateIso(date?: Date) {
  if (!date) {
    return undefined
  }

  const result = new Date(date)
  result.setHours(12, 0, 0, 0)
  return result.toISOString()
}

export function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString() : "Not set"
}

export function formatDateTime(value?: string | null) {
  return value ? new Date(value).toLocaleString() : "Not set"
}

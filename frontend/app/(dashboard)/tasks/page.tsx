"use client"

import { useMemo } from "react"

import { TasksTable } from "@/components/tasks-table"
import { useWorkspace } from "@/components/workspace-provider"

export default function TasksPage() {
  const { projects, loading } = useWorkspace()

  const tasks = useMemo(
    () =>
      projects.flatMap((project) =>
        project.tasks.map((task) => ({
          ...task,
          projectName: project.name,
        }))
      ),
    [projects]
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">All Tasks</h2>
      </div>
      <TasksTable tasks={tasks} loading={loading.workspace} />
    </div>
  )
}

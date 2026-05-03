"use client"

import { ProjectsTable } from "@/components/projects-table"
import { useWorkspace } from "@/components/workspace-provider"

export default function ProjectsPage() {
  const { projects, loading } = useWorkspace()

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">All Projects</h2>
      </div>
      <ProjectsTable projects={projects} loading={loading.workspace} />
    </div>
  )
}

"use client"

import { FileX } from "lucide-react"

import { type Project } from "@/lib/api"
import { completionRate, formatDate } from "@/lib/workspace"
import { ProjectEditDialog } from "@/components/project-edit-dialog"
import { useWorkspace } from "@/components/workspace-provider"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function ProjectsTable({
  projects,
  loading = false,
}: {
  projects: Project[]
  loading?: boolean
}) {
  const { auth } = useWorkspace()
  const isAdmin = auth?.user.role === "ADMIN"

  if (loading && !projects.length) {
    return (
      <>
        <div className="space-y-3 md:hidden">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="space-y-3 p-4">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="hidden rounded-md border md:block">
          <div className="space-y-4 p-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </>
    )
  }

  if (!projects.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <FileX className="mb-3 size-12" />
        <p className="text-lg font-medium">No projects found</p>
        <p className="text-sm">Create a project to start organizing work.</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3 md:hidden">
        {projects.map((project) => (
          <Card key={project.id}>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{project.name}</p>
                    <p className="text-xs text-muted-foreground">{project.owner.name}</p>
                  </div>
                  <Badge>{completionRate(project)}%</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {project.members.length + 1} members · {project.tasks.length} tasks
                </p>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">Due: {formatDate(project.dueDate)}</p>
                  {isAdmin ? <ProjectEditDialog project={project} /> : null}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="hidden rounded-md border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Tasks</TableHead>
              <TableHead>Due date</TableHead>
              <TableHead className="text-right">Progress</TableHead>
              {isAdmin ? <TableHead className="w-14 text-right">Edit</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => (
              <TableRow key={project.id}>
                <TableCell className="font-medium">{project.name}</TableCell>
                <TableCell>{project.owner.name}</TableCell>
                <TableCell>{project.members.length + 1}</TableCell>
                <TableCell>{project.tasks.length}</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(project.dueDate)}
                </TableCell>
                <TableCell className="text-right">
                  <Badge>{completionRate(project)}%</Badge>
                </TableCell>
                {isAdmin ? (
                  <TableCell className="text-right">
                    <ProjectEditDialog project={project} />
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  )
}

import { prisma } from "../config/prisma.js"
import { asyncHandler } from "../utils/http.js"

export const getDashboard = asyncHandler(async (req, res) => {
  const membershipFilter =
    req.user.role === "ADMIN"
      ? {}
      : {
          OR: [
            { ownerId: req.user.id },
            { members: { some: { userId: req.user.id } } },
          ],
        }

  const assigneeFilter = req.user.role === "ADMIN" ? {} : { assigneeId: req.user.id }

  const [projects, tasks, overdueTasks, recentTasks] = await Promise.all([
    prisma.project.count({ where: membershipFilter }),
    prisma.task.groupBy({
      by: ["status"],
      where:
        req.user.role === "ADMIN"
          ? {}
          : {
              project: membershipFilter,
            },
      _count: { _all: true },
    }),
    prisma.task.findMany({
      where: {
        ...assigneeFilter,
        status: { not: "DONE" },
        dueDate: { lt: new Date() },
      },
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
      },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
    prisma.task.findMany({
      where:
        req.user.role === "ADMIN"
          ? {}
          : {
              project: membershipFilter,
            },
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
  ])

  const statusCounts = {
    TODO: 0,
    IN_PROGRESS: 0,
    DONE: 0,
  }

  for (const entry of tasks) {
    statusCounts[entry.status] = entry._count._all
  }

  res.json({
    summary: {
      projects,
      tasks: Object.values(statusCounts).reduce((sum, count) => sum + count, 0),
      overdue: overdueTasks.length,
      statusCounts,
    },
    overdueTasks,
    recentTasks,
  })
})

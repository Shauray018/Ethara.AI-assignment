import { prisma } from "../config/prisma.js"
import { AppError, asyncHandler } from "../utils/http.js"

async function ensureAssignable(projectId, assigneeId) {
  if (!assigneeId) {
    return
  }

  const membership = await prisma.projectMember.findFirst({
    where: { projectId, userId: assigneeId },
  })

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  })

  if (!membership && project?.ownerId !== assigneeId) {
    throw new AppError(400, "Assignee must belong to the project")
  }
}

export const createTask = asyncHandler(async (req, res) => {
  const { projectId } = req.validated.params
  const { title, description, assigneeId, dueDate, status } = req.validated.body

  await ensureAssignable(projectId, assigneeId)

  const task = await prisma.task.create({
    data: {
      title,
      description,
      assigneeId,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      status: status ?? "TODO",
      projectId,
      createdById: req.user.id,
    },
    include: {
      assignee: {
        select: { id: true, name: true, email: true, role: true },
      },
      project: {
        select: { id: true, name: true },
      },
    },
  })

  res.status(201).json({ task })
})

export const updateTask = asyncHandler(async (req, res) => {
  const { taskId } = req.validated.params
  const updates = req.validated.body

  const currentTask = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      project: {
        include: {
          members: {
            where: { userId: req.user.id },
            select: { id: true },
          },
        },
      },
    },
  })

  if (!currentTask) {
    throw new AppError(404, "Task not found")
  }

  const canEdit =
    req.user.role === "ADMIN" ||
    currentTask.project.ownerId === req.user.id ||
    currentTask.assigneeId === req.user.id ||
    currentTask.project.members.length > 0

  if (!canEdit) {
    throw new AppError(403, "Task access denied")
  }

  if (updates.assigneeId !== undefined) {
    await ensureAssignable(
      updates.projectId ?? currentTask.projectId,
      updates.assigneeId ?? undefined
    )
  }

  if (updates.projectId && updates.projectId !== currentTask.projectId) {
    await ensureAssignable(updates.projectId, currentTask.assigneeId ?? undefined)
  }

  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      ...updates,
      dueDate:
        updates.dueDate === undefined
          ? undefined
          : updates.dueDate === null
            ? null
            : new Date(updates.dueDate),
    },
    include: {
      assignee: {
        select: { id: true, name: true, email: true, role: true },
      },
      project: {
        select: { id: true, name: true },
      },
    },
  })

  res.json({ task })
})

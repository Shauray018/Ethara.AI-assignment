import { prisma } from "../config/prisma.js"
import { AppError, asyncHandler } from "../utils/http.js"

const projectInclude = {
  owner: {
    select: { id: true, name: true, email: true, role: true },
  },
  members: {
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  },
  tasks: {
    include: {
      assignee: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
    orderBy: [
      { status: "asc" },
      { dueDate: "asc" },
      { createdAt: "desc" },
    ],
  },
}

export const listProjects = asyncHandler(async (req, res) => {
  const where =
    req.user.role === "ADMIN"
      ? {}
      : {
          OR: [
            { ownerId: req.user.id },
            { members: { some: { userId: req.user.id } } },
          ],
        }

  const projects = await prisma.project.findMany({
    where,
    include: projectInclude,
    orderBy: { createdAt: "desc" },
  })

  res.json({ projects })
})

export const createProject = asyncHandler(async (req, res) => {
  const { name, description, dueDate, memberIds } = req.validated.body
  const uniqueMemberIds = [...new Set(memberIds.filter((id) => id !== req.user.id))]

  const project = await prisma.project.create({
    data: {
      name,
      description,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      ownerId: req.user.id,
      members: uniqueMemberIds.length
        ? {
            create: uniqueMemberIds.map((userId) => ({ userId })),
          }
        : undefined,
    },
    include: projectInclude,
  })

  res.status(201).json({ project })
})

export const getProject = asyncHandler(async (req, res) => {
  const project = await prisma.project.findUnique({
    where: { id: req.params.id },
    include: projectInclude,
  })

  if (!project) {
    throw new AppError(404, "Project not found")
  }

  res.json({ project })
})

export const addProjectMembers = asyncHandler(async (req, res) => {
  const { memberIds } = req.validated.body
  const { projectId } = req.validated.params

  await prisma.projectMember.createMany({
    data: [...new Set(memberIds)].map((userId) => ({
      projectId,
      userId,
    })),
    skipDuplicates: true,
  })

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: projectInclude,
  })

  res.json({ project })
})

export const updateProject = asyncHandler(async (req, res) => {
  const { projectId } = req.validated.params
  const { name, description, dueDate, ownerId, memberIds } = req.validated.body

  const currentProject = await prisma.project.findUnique({
    where: { id: projectId },
    include: projectInclude,
  })

  if (!currentProject) {
    throw new AppError(404, "Project not found")
  }

  const nextOwnerId = ownerId ?? currentProject.ownerId
  const normalizedMemberIds = memberIds
    ? [...new Set(memberIds.filter((id) => id !== nextOwnerId))]
    : null

  await prisma.project.update({
    where: { id: projectId },
    data: {
      name,
      description: description === undefined ? undefined : description,
      dueDate:
        dueDate === undefined
          ? undefined
          : dueDate === null
            ? null
            : new Date(dueDate),
      ownerId,
      members: normalizedMemberIds
        ? {
            deleteMany: {},
            create: normalizedMemberIds.map((userId) => ({ userId })),
          }
        : undefined,
    },
  })

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: projectInclude,
  })

  res.json({ project })
})

import jwt from "jsonwebtoken"

import { prisma } from "../config/prisma.js"
import { env } from "../config/env.js"
import { AppError, asyncHandler } from "../utils/http.js"

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization

  if (!header?.startsWith("Bearer ")) {
    throw new AppError(401, "Authentication required")
  }

  const token = header.slice(7)
  const payload = jwt.verify(token, env.JWT_SECRET)

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, name: true, email: true, role: true },
  })

  if (!user) {
    throw new AppError(401, "Invalid token")
  }

  req.user = user
  next()
})

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError(403, "Insufficient permissions"))
    }

    next()
  }
}

export const requireProjectAccess = asyncHandler(async (req, _res, next) => {
  const projectId = req.params.projectId ?? req.params.id

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      members: {
        where: { userId: req.user.id },
        select: { id: true },
      },
    },
  })

  if (!project) {
    throw new AppError(404, "Project not found")
  }

  const hasAccess =
    req.user.role === "ADMIN" ||
    project.ownerId === req.user.id ||
    project.members.length > 0

  if (!hasAccess) {
    throw new AppError(403, "Project access denied")
  }

  req.project = project
  next()
})

export const requireProjectAdmin = (req, _res, next) => {
  const canManageProject =
    req.user?.role === "ADMIN" || req.project?.ownerId === req.user?.id

  if (!canManageProject) {
    return next(new AppError(403, "Project management access denied"))
  }

  next()
}

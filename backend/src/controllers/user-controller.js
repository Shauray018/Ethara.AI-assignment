import { prisma } from "../config/prisma.js"
import { asyncHandler } from "../utils/http.js"

export const listMembers = asyncHandler(async (_req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  })

  res.json({ users })
})

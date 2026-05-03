import { prisma } from "../config/prisma.js"
import { comparePassword, hashPassword, signToken } from "../utils/auth.js"
import { AppError, asyncHandler } from "../utils/http.js"

function authResponse(user) {
  return {
    token: signToken(user),
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  }
}

export const signup = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.validated.body

  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) {
    throw new AppError(409, "Email already registered")
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: await hashPassword(password),
      role: role ?? "MEMBER",
    },
  })

  res.status(201).json(authResponse(user))
})

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.validated.body

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    throw new AppError(401, "Invalid credentials")
  }

  const isValid = await comparePassword(password, user.passwordHash)
  if (!isValid) {
    throw new AppError(401, "Invalid credentials")
  }

  res.json(authResponse(user))
})

export const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user })
})

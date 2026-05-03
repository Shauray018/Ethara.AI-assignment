import { z } from "zod"

export const signupSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(80),
    email: z.string().trim().email(),
    password: z.string().min(6).max(100),
    role: z.enum(["ADMIN", "MEMBER"]).optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
})

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email(),
    password: z.string().min(6).max(100),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
})

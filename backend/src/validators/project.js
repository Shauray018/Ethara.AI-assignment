import { z } from "zod"

const isoDate = z
  .string()
  .datetime()
  .optional()
  .or(z.literal("").transform(() => undefined))

export const createProjectSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(120),
    description: z.string().trim().max(600).optional(),
    dueDate: isoDate,
    memberIds: z.array(z.string().cuid()).optional().default([]),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
})

export const addProjectMembersSchema = z.object({
  body: z.object({
    memberIds: z.array(z.string().cuid()).min(1),
  }),
  params: z.object({
    projectId: z.string().cuid(),
  }),
  query: z.object({}).optional(),
})

export const updateProjectSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(2).max(120).optional(),
      description: z.string().trim().max(600).nullable().optional(),
      dueDate: isoDate.nullable().optional(),
      ownerId: z.string().cuid().optional(),
      memberIds: z.array(z.string().cuid()).optional(),
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: "Provide at least one field to update",
    }),
  params: z.object({
    projectId: z.string().cuid(),
  }),
  query: z.object({}).optional(),
})

export const projectIdSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    id: z.string().cuid(),
  }),
  query: z.object({}).optional(),
})

import { z } from "zod"

const optionalDate = z
  .string()
  .datetime()
  .optional()
  .or(z.literal("").transform(() => undefined))

export const createTaskSchema = z.object({
  body: z.object({
    title: z.string().trim().min(2).max(120),
    description: z.string().trim().max(1000).optional(),
    assigneeId: z.string().cuid().optional(),
    dueDate: optionalDate,
    status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  }),
  params: z.object({
    projectId: z.string().cuid(),
  }),
  query: z.object({}).optional(),
})

export const updateTaskSchema = z.object({
  body: z
    .object({
      title: z.string().trim().min(2).max(120).optional(),
      description: z.string().trim().max(1000).optional(),
      projectId: z.string().cuid().optional(),
      assigneeId: z.string().cuid().nullable().optional(),
      dueDate: optionalDate.nullable().optional(),
      status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: "Provide at least one field to update",
    }),
  params: z.object({
    taskId: z.string().cuid(),
  }),
  query: z.object({}).optional(),
})

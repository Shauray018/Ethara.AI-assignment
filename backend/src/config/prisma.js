import { PrismaPg } from "@prisma/adapter-pg"
import prismaClient from "@prisma/client"

import { env } from "./env.js"

const { PrismaClient } = prismaClient

const adapter = new PrismaPg({
  connectionString: env.DATABASE_URL,
})

export const prisma = new PrismaClient({ adapter })

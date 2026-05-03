import cors from "cors"
import express from "express"

import { env } from "./config/env.js"
import authRoutes from "./routes/auth-routes.js"
import dashboardRoutes from "./routes/dashboard-routes.js"
import projectRoutes from "./routes/project-routes.js"
import taskRoutes from "./routes/task-routes.js"
import userRoutes from "./routes/user-routes.js"
import { errorHandler } from "./middleware/error-handler.js"

export const app = express()

app.use(
  cors({
    origin: env.CLIENT_URL,
  })
)
app.use(express.json())

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" })
})

app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.use("/api/projects", projectRoutes)
app.use("/api/tasks", taskRoutes)
app.use("/api/dashboard", dashboardRoutes)

app.use(errorHandler)

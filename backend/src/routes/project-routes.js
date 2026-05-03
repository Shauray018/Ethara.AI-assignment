import { Router } from "express"

import {
  addProjectMembers,
  createProject,
  getProject,
  listProjects,
  updateProject,
} from "../controllers/project-controller.js"
import { createTask } from "../controllers/task-controller.js"
import {
  requireAuth,
  requireProjectAccess,
  requireProjectAdmin,
  requireRole,
} from "../middleware/auth.js"
import { validate } from "../middleware/validate.js"
import {
  addProjectMembersSchema,
  createProjectSchema,
  projectIdSchema,
  updateProjectSchema,
} from "../validators/project.js"
import { createTaskSchema } from "../validators/task.js"

const router = Router()

router.use(requireAuth)

router.get("/", listProjects)
router.post("/", requireRole("ADMIN"), validate(createProjectSchema), createProject)
router.get("/:id", validate(projectIdSchema), requireProjectAccess, getProject)
router.patch(
  "/:projectId",
  requireRole("ADMIN"),
  validate(updateProjectSchema),
  updateProject
)
router.post(
  "/:projectId/members",
  validate(addProjectMembersSchema),
  requireProjectAccess,
  requireProjectAdmin,
  addProjectMembers
)
router.post(
  "/:projectId/tasks",
  validate(createTaskSchema),
  requireProjectAccess,
  createTask
)

export default router

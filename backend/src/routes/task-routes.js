import { Router } from "express"

import { updateTask } from "../controllers/task-controller.js"
import { requireAuth } from "../middleware/auth.js"
import { validate } from "../middleware/validate.js"
import { updateTaskSchema } from "../validators/task.js"

const router = Router()

router.use(requireAuth)
router.patch("/:taskId", validate(updateTaskSchema), updateTask)

export default router

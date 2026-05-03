import { Router } from "express"

import { listMembers } from "../controllers/user-controller.js"
import { requireAuth } from "../middleware/auth.js"

const router = Router()

router.get("/", requireAuth, listMembers)

export default router

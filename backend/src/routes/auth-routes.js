import { Router } from "express"

import { login, me, signup } from "../controllers/auth-controller.js"
import { requireAuth } from "../middleware/auth.js"
import { validate } from "../middleware/validate.js"
import { loginSchema, signupSchema } from "../validators/auth.js"

const router = Router()

router.post("/signup", validate(signupSchema), signup)
router.post("/login", validate(loginSchema), login)
router.get("/me", requireAuth, me)

export default router

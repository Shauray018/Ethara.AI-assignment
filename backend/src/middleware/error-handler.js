import { ZodError } from "zod"

export function errorHandler(error, _req, res, _next) {
  if (error instanceof ZodError) {
    return res.status(400).json({
      message: "Validation failed",
      errors: error.flatten(),
    })
  }

  if (error.statusCode) {
    return res.status(error.statusCode).json({ message: error.message })
  }

  console.error(error)
  return res.status(500).json({ message: "Internal server error" })
}

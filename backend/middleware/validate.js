import { z } from "zod";

export const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ 
        message: "Validation failed", 
        errors: err.errors.map(e => ({ path: e.path.join('.'), message: e.message })) 
      });
    }
    next(err);
  }
};

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const habitSchema = z.object({
  name: z.string().min(1, "Habit name is required").max(100),
  description: z.string().max(500).optional().default(""),
  category: z.string().min(1, "Category is required"),
  frequency: z.enum(["daily", "weekly"]),
  targetDays: z.number().min(1).max(7).optional(),
  icon: z.string().optional().default("🎯"),
  color: z.string().optional().default("#3b82f6"),
});

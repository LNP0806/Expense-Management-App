const { z } = require("zod");

const registerSchema = z.object({
  fullname: z
    .string({
      invalid_type_error: "Fullname must be a string",
    })
    .min(1, "Fullname is required")
    .max(100, "Fullname must be less than 100 characters long"),
  email: z
    .string({
      invalid_type_error: "Email must be a string",
    })
    .email("Invalid email address"),
  password: z
    .string({
      invalid_type_error: "Password must be a string",
    })
    .min(6, "Password must be at least 6 characters long"),
});

const loginSchema = z.object({
  email: z
    .string({
      invalid_type_error: "Email must be a string",
    })
    .email("Invalid email address"),
  password: z
    .string({
      invalid_type_error: "Password must be a string",
    })
    .min(6, "Password must be at least 6 characters long"),
});

module.exports = {
  registerSchema,
  loginSchema,
};
const { z } = require("zod");

const createCategorySchema = z.object({
  name: z
    .string({
      invalid_type_error: "Name must be a string",
    })
    .min(1, "Name can not be empty")
    .max(100, "Name must be less than 100 characters"),

  description: z
    .string({
      invalid_type_error: "Description must be a string",
    })
    .max(100, "Name must be less than 100 characters"),
});

const updateCategory = z
  .object({
    name: z
      .string({
        invalid_type_error: "Name must be a string",
      })
      .min(1, "Name can not be empty")
      .max(100, "Name must be less than 100 characters")
      .optional(),

    description: z
      .string({
        invalid_type_error: "Description must be a string",
      })
      .min(1, "Description can not be empty")
      .max(100, "Description must be less than 100 characters")
      .optional(),
  })
  .refine((data) => data.name !== undefined || data.description !== undefined, {
    message: "At least one field is required",
  });

const categoryListQuerySchema = z.object({
  page: z.coerce
    .number()
    .int("Page must be an integer")
    .positive("Page must be greater than 0")
    .default(1),

  limit: z.coerce
    .number()
    .int("Limit must be an integer")
    .positive("Limit must be greater than 0")
    .max(100, "Limit must be less than or equal to 100")
    .default(10),

  keyword: z.string().trim().min(1, "Keyword cannot be empty").optional(),
});

module.exports = {
  createCategorySchema,
  updateCategory,
  categoryListQuerySchema,
};

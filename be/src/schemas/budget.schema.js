const { z } = require("zod");

const createBudgetSchema = z.object({
  title: z
    .string({
      required_error: "Title is required",
      invalid_type_error: "Title must be a string",
    })
    .min(1, "Title can not be empty")
    .max(100, "Title must be less than 100 characters"),

  description: z
    .string({ invalid_type_error: "Description must be a string" })
    .min(1, "Description can not be empty")
    .max(1000, "Description must be less than 1000 characters")
    .optional()
    .nullable(),

  amount: z
    .number({
      required_error: "Amount is required",
      invalid_type_error: "Amount must be a number",
    })
    .min(1, "Amount must be greater than 0"),

  category_id: z
    .string()
    .uuid("Invalid category id format")
    .optional()
    .nullable(),

  start_date: z
    .string({ required_error: "Start date is required" })
    .date("Invalid date format (YYYY-MM-DD)"),

  end_date: z
    .string({ required_error: "End date is required" })
    .date("Invalid date format (YYYY-MM-DD)"),
});

const updateBudgetSchema = z
  .object({
    title: z
      .string({
        invalid_type_error: "Title must be a string",
      })
      .min(1, "Title can not be empty")
      .max(100, "Title must be less than 100 characters")
      .optional(),

    description: z
      .string({ invalid_type_error: "Description must be a string" })
      .min(1, "Description can not be empty")
      .max(1000, "Description must be less than 1000 characters")
      .optional(),

    amount: z
      .number({
        invalid_type_error: "Amount must be a number",
      })
      .min(1, "Amount must be greater than 0")
      .optional(),

    category_id: z.string().uuid("Invalid category id format").optional(),

    start_date: z.string().date("Invalid date format (YYYY-MM-DD)").optional(),

    end_date: z.string().date("Invalid date format (YYYY-MM-DD)").optional(),
  })
  .refine(
    (data) =>
      data.title !== undefined ||
      data.description !== undefined ||
      data.amount !== undefined ||
      data.category_id !== undefined ||
      data.start_date !== undefined ||
      data.end_date !== undefined,
    {
      message: "At least one field is required",
    },
  );

const budgetQueryListSchema = z.object({
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
});

module.exports = {
  createBudgetSchema,
  updateBudgetSchema,
  budgetQueryListSchema,
};

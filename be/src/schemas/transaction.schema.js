const { z, optional } = require("zod");

const createTransactionSchema = z.object({
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

  type: z.enum(["INCOME", "EXPENSE"], {
    error_map: () => ({ message: "Type must be either INCOME or EXPENSE" }),
  }),

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

  transaction_date: z
    .string()
    .date("Invalid date format (YYYY-MM-DD)")
    .optional()
    .nullable(),
});

const updateTransactionSchema = z
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

    type: z
      .enum(["INCOME", "EXPENSE"], {
        error_map: () => ({ message: "Type must be either INCOME or EXPENSE" }),
      })
      .optional(),

    amount: z
      .number({
        invalid_type_error: "Amount must be a number",
      })
      .min(1, "Amount must be greater than 0")
      .optional(),

    category_id: z.string().uuid("Invalid category id format").optional(),

    transaction_date: z
      .string()
      .date("Invalid date format (YYYY-MM-DD)")
      .optional(),
  })
  .refine(
    (data) =>
      data.title !== undefined ||
      data.description !== undefined ||
      data.type !== undefined ||
      data.amount !== undefined ||
      data.category_id !== undefined ||
      data.transaction_date !== undefined,
    {
      message: "At least one field is required",
    },
  );

const transactionQueryListSchema = z.object({
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

  type: z
    .enum(["INCOME", "EXPENSE"], {
      error_map: () => ({ message: "Type must be either INCOME or EXPENSE" }),
    })
    .optional(),
});

module.exports = {
  createTransactionSchema,
  updateTransactionSchema,
  transactionQueryListSchema,
};

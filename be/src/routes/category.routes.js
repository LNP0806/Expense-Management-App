const express = require("express");

const asyncHandler = require("../middlewares/async-handler.middleware");
const categoryController = require("../controllers/category.controller");
const requireAuth = require("../middlewares/auth.middleware");
const {
  validateBody,
  validateQuery,
} = require("../middlewares/validate.middleware");

const {
  createCategorySchema,
  updateCategory,
  categoryListQuerySchema,
} = require("../schemas/category.schema");

const router = express.Router();
router.use(requireAuth);

router.get(
  "/",
  validateQuery(categoryListQuerySchema),
  asyncHandler(categoryController.getAllCategories),
);

router.get("/:id", asyncHandler(categoryController.getCategoryById));

router.post(
  "/",
  validateBody(createCategorySchema),
  asyncHandler(categoryController.createCategory),
);

router.patch(
  "/:id",
  validateBody(updateCategory),
  asyncHandler(categoryController.updateCategory),
);

router.delete("/:id", asyncHandler(categoryController.deleteCategory));

module.exports = router;

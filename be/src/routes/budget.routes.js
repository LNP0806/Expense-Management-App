const express = require("express");

const asyncHandler = require("../middlewares/async-handler.middleware");
const {
  validateBody,
  validateQuery,
} = require("../middlewares/validate.middleware");
const {
  createBudgetSchema,
  updateBudgetSchema,
  budgetQueryListSchema,
} = require("../schemas/budget.schema");
const requireAuth = require("../middlewares/auth.middleware");
const budgetController = require("../controllers/budget.controller");

const router = express.Router();

router.use(requireAuth);

router.get(
  "/",
  validateQuery(budgetQueryListSchema),
  asyncHandler(budgetController.getBudgetByUser),
);

router.get("/:id", asyncHandler(budgetController.getBudgetById));

router.post(
  "/",
  validateBody(createBudgetSchema),
  asyncHandler(budgetController.createBudget),
);

router.patch(
  "/:id",
  validateBody(updateBudgetSchema),
  asyncHandler(budgetController.updateBudget),
);

router.delete("/:id", asyncHandler(budgetController.deleteBudget));

module.exports = router;

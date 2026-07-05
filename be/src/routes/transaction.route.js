const express = require("express");

const asyncHandler = require("../middlewares/async-handler.middleware");
const requireAuth = require("../middlewares/auth.middleware");
const {
  validateBody,
  validateQuery,
} = require("../middlewares/validate.middleware");
const {
  createTransactionSchema,
  updateTransactionSchema,
  transactionQueryListSchema,
  getSumaryTransactionSchema,
  getCategoryBreakdownSchema,
} = require("../schemas/transaction.schema");
const transactionController = require("../controllers/transaction.controller");
const uploadMiddleware = require("../middlewares/upload.middleware");

const router = express.Router();

router.use(requireAuth);

router.get(
  "/",
  validateQuery(transactionQueryListSchema),
  asyncHandler(transactionController.getTransactionByUser),
);

router.get(
  "/sumary",
  validateQuery(getSumaryTransactionSchema),
  asyncHandler(transactionController.getSumaryTransaction),
);

router.get(
  "/category-breakdown",
  validateQuery(getCategoryBreakdownSchema),
  asyncHandler(transactionController.getCategoryBreakdown),
);

router.get(
  "/daily-spending",
  asyncHandler(transactionController.getDailySpending),
);

router.get("/:id", asyncHandler(transactionController.getTransactionById));

router.post(
  "/",
  uploadMiddleware.single("image"),
  validateBody(createTransactionSchema),
  asyncHandler(transactionController.createTransaction),
);

router.patch(
  "/:id",
  validateBody(updateTransactionSchema),
  asyncHandler(transactionController.updateTransaction),
);

router.delete("/:id", asyncHandler(transactionController.deleteTransaction));

module.exports = router;

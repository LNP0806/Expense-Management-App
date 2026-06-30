const express = require("express");

const asyncHandler = require("../middlewares/async-handler.middleware");
const { requireAuth } = require("../middlewares/auth.middleware");
const {
  validateBody,
  validateQuery,
} = require("../middlewares/validate.middleware");
const {
  createTransactionSchema,
  updateTransactionSchema,
  transactionQueryListSchema,
} = require("../schemas/transaction.schema");
const transactionController = require("../controllers/transaction.controller");

const router = express.Router();

router.use(requireAuth);

router.get(
  "/",
  validateQuery(transactionQueryListSchema),
  asyncHandler(transactionController.getTransactionByUser),
);

router.get("/:id", asyncHandler(transactionController.getTransactionById));

router.post(
  "/",
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

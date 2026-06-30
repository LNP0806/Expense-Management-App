const { successResponse } = require("../utils/api-response");

const transactionService = require("../services/transaction.service");

const getTransactionByUser = async (req, res, next) => {
  const user_id = req.user.id;

  const { page, limit, keyword, type } = req.validateQuery;

  const result = await transactionService.getTransactionByUser(user_id, {
    page,
    limit,
    keyword,
    type,
  });

  return successResponse(
    res,
    "Get transactions successfully",
    result.data,
    200,
    result.metadata,
  );
};

const getTransactionById = async (req, res, next) => {
  const user_id = req.user.id;

  const id = req.params.id;

  const result = await transactionService.getTransactionById(user_id, id);

  return successResponse(res, "Get transaction successfully", result);
};

const createTransaction = async (req, res, next) => {
  const user_id = req.user.id;

  const { title, description, type, category_id, amount, transaction_date } =
    req.validateBody;

  const result = await transactionService.createTransaction(user_id, {
    title,
    description,
    type,
    category_id,
    amount,
    transaction_date,
  });

  return successResponse(res, "Create transaction successfully", result, 201);
};

const updateTransaction = async (req, res, next) => {
  const user_id = req.user.id;

  const id = req.params.id;

  const { title, description, type, category_id, amount, transaction_date } =
    req.validateBody;

  const result = await transactionService.updateTransaction(user_id, id, {
    title,
    description,
    type,
    category_id,
    amount,
    transaction_date,
  });

  return successResponse(res, "Update transaction successfully", result);
};

const deleteTransaction = async (req, res, next) => {
  const user_id = req.user.id;

  const id = req.params.id;

  const result = await transactionService.deleteTransaction(user_id, id);

  return successResponse(res, "Delete transaction successfully", result);
};

module.exports = {
  getTransactionById,
  getTransactionByUser,
  createTransaction,
  updateTransaction,
  deleteTransaction,
};

const AppError = require("../utils/app-error");

const transactionRepo = require("../repositories/transaction.repository");
const {
  isCategoryBelongToUser,
} = require("../repositories/category.repository");

const getTransactionByUser = async (user_id, payload) => {
  const { page, limit, keyword, type } = payload;

  const offset = (page - 1) * limit;

  const result = await transactionRepo.getTransactionByUser(user_id, {
    limit,
    offset,
    keyword,
    type,
  });

  const transactions = result.data.map((transaction) => ({
    id: transaction.id,
    userId: transaction.user_id,
    title: transaction.title,
    description: transaction.description,
    type: transaction.type,
    categoryId: transaction.category_id,
    amount: transaction.amount,
    transactionDate: transaction.transaction_date,
    createdAt: transaction.created_at,
    updatedAt: transaction.updated_at,
  }));

  const totalPages = Math.ceil(result.total / limit);

  return {
    data: transactions,
    metadata: {
      page,
      limit,
      totalItems: result.total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
};

const getTransactionById = async (user_id, id) => {
  const transaction = await transactionRepo.getTransactionById(user_id, id);

  if (!transaction) {
    throw new AppError("Transaction not found", 404);
  }

  return {
    id: transaction.id,
    userId: transaction.user_id,
    title: transaction.title,
    description: transaction.description,
    type: transaction.type,
    categoryId: transaction.category_id,
    amount: transaction.amount,
    transactionDate: transaction.transaction_date,
    createdAt: transaction.created_at,
    updatedAt: transaction.updated_at,
  };
};

const createTransaction = async (user_id, payload) => {
  const { title, description, type, category_id, amount, transaction_date } =
    payload;

  if (category_id) {
    const isValidCategory = await isCategoryBelongToUser(user_id, category_id);

    if (!isValidCategory) {
      throw new AppError("Category is not belong to user", 401);
    }
  }

  const newTransaction = await transactionRepo.createTransaction(user_id, {
    title,
    description,
    type,
    category_id,
    amount,
    transaction_date,
  });

  return {
    id: newTransaction.id,
    userId: newTransaction.user_id,
    title: newTransaction.title,
    description: newTransaction.description,
    type: newTransaction.type,
    categoryId: newTransaction.category_id,
    amount: newTransaction.amount,
    transactionDate: newTransaction.transaction_date,
    createdAt: newTransaction.created_at,
    updatedAt: newTransaction.updated_at,
  };
};

const updateTransaction = async (user_id, id, payload) => {
  const isValidTransaction = await transactionRepo.isTransactionBelongToUser(
    user_id,
    id,
  );

  if (!isValidTransaction) {
    throw new AppError("Transaction is not belong to user", 401);
  }

  const { title, description, type, category_id, amount, transaction_date } =
    payload;

  if (category_id) {
    const isValidCategory = await isCategoryBelongToUser(user_id, category_id);

    if (!isValidCategory) {
      throw new AppError("Category is not belong to user", 401);
    }
  }

  const updatedTransaction = await transactionRepo.updateTransaction(id, {
    title,
    description,
    type,
    category_id,
    amount,
    transaction_date,
  });

  return {
    id: updatedTransaction.id,
    userId: updatedTransaction.user_id,
    title: updatedTransaction.title,
    description: updatedTransaction.description,
    type: updatedTransaction.type,
    categoryId: updatedTransaction.category_id,
    amount: updatedTransaction.amount,
    transactionDate: updatedTransaction.transaction_date,
    createdAt: updatedTransaction.created_at,
    updatedAt: updatedTransaction.updated_at,
  };
};

const deleteTransaction = async (user_id, id) => {
  const isValidTransaction = await transactionRepo.isTransactionBelongToUser(
    user_id,
    id,
  );

  if (!isValidTransaction) {
    throw new AppError("Transaction is not belong to user", 401);
  }

  const deletedTransaction = await transactionRepo.deleteTransaction(id);

  return {
    id: deletedTransaction.id,
    userId: deletedTransaction.user_id,
    title: deletedTransaction.title,
    description: deletedTransaction.description,
    type: deletedTransaction.type,
    categoryId: deletedTransaction.category_id,
    amount: deletedTransaction.amount,
    transactionDate: deletedTransaction.transaction_date,
    createdAt: deletedTransaction.created_at,
    updatedAt: deletedTransaction.updated_at,
    deletedAt: deletedTransaction.deleted_at,
  };
};

module.exports = {
  getTransactionByUser,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
};

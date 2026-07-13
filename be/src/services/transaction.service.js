const AppError = require("../utils/app-error");

const transactionRepo = require("../repositories/transaction.repository");
const {
  isCategoryBelongToUser,
} = require("../repositories/category.repository");

const getTransactionByUser = async (user_id, payload) => {
  const { page, limit, keyword, type } = payload;

  const offset = (page - 1) * limit;

  const transactions = await transactionRepo.getTransactionByUser(user_id, {
    limit,
    offset,
    keyword,
    type,
  });
  const totalPages = Math.ceil(transactions.total / limit);

  return {
    data: transactions,
    metadata: {
      page,
      limit,
      totalItems: transactions.total,
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
    transaction,
  };
};

const createTransaction = async (user_id, payload) => {
  const {
    id,
    title,
    description,
    type,
    category_id,
    amount,
    image_url,
    transaction_date,
  } = payload;

  if (category_id) {
    const isValidCategory = await isCategoryBelongToUser(user_id, category_id);

    if (!isValidCategory) {
      throw new AppError("Category is not belong to user", 401);
    }
  }

  const newTransaction = await transactionRepo.createTransaction(user_id, {
    id,
    title,
    description,
    type,
    category_id,
    amount,
    image_url,
    transaction_date,
  });

  return {
    newTransaction,
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

  const {
    title,
    description,
    type,
    category_id,
    amount,
    transaction_date,
    image_url,
  } = payload;

  if (category_id) {
    const isValidCategory = await isCategoryBelongToUser(user_id, category_id);

    if (!isValidCategory) {
      throw new AppError("Category is not belong to user", 401);
    }
  }

  const payloadToUpdate = {
    title,
    description,
    type,
    category_id,
    amount,
    transaction_date,
  };

  if (payload.hasOwnProperty("image_url")) {
    payloadToUpdate.image_url = image_url;
  }

  const updatedTransaction = await transactionRepo.updateTransaction(
    id,
    payloadToUpdate,
  );

  return {
    updatedTransaction,
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
    deletedTransaction,
  };
};

const getSumaryTransaction = async (user_id, payload) => {
  const { month, year } = payload;

  const sumary = await transactionRepo.getSumaryTransaction(user_id, {
    month,
    year,
  });

  let monthly_income = 0;
  let monthly_expense = 0;

  const transactions = sumary.map((item) => {
    if (item.type === "INCOME" || item.type === "income") {
      monthly_income = monthly_income + Number(item.amount);
    } else {
      monthly_expense = monthly_expense + Number(item.amount);
    }
  });

  const saving_rate =
    monthly_income > 0
      ? ((monthly_income - monthly_expense) / monthly_income) * 100
      : 0;

  return {
    monthly_income,
    monthly_expense,
    saving_rate,
  };
};

const getCategoryBreakdown = async (user_id, payload) => {
  const { month, year, type } = payload;

  const result = await transactionRepo.getCategoryBreakdown(user_id, {
    month,
    year,
    type,
  });

  const totalAmount = result.reduce(
    (sum, item) => sum + Number(item.total_amount),
    0,
  );

  const data = result.map((item) => ({
    category_id: item.category_id,
    category_name: item.name,
    amount: item.total_amount,
    percentage: (Number(item.total_amount) * 100) / totalAmount,
  }));

  return {
    data,
  };
};

const getDailySpending = async (user_id) => {
  const result = await transactionRepo.getDailySpending(user_id);

  return {
    result,
  };
};

module.exports = {
  getTransactionByUser,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getSumaryTransaction,
  getCategoryBreakdown,
  getDailySpending,
};

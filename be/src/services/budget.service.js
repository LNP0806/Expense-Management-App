const AppError = require("../utils/app-error");

const budgetRepo = require("../repositories/budget.repository");

const {
  isCategoryBelongToUser,
} = require("../repositories/category.repository");

const getBudgetByUser = async (user_id, payload) => {
  const { page, limit } = payload;

  const offset = (page - 1) * limit;

  const budgets = await budgetRepo.getBudgetByUser(user_id, { limit, offset });

  const totalPages = Math.ceil(budgets.total / limit);

  return {
    data: budgets,
    metadata: {
      page,
      limit,
      totalItems: budgets.total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
};

const getBudgetById = async (user_id, id) => {
  const budget = await budgetRepo.getBudgetById(user_id, id);

  return {
    budget,
  };
};

const createBudget = async (user_id, payload) => {
  const { title, description, category_id, amount, start_date, end_date } =
    payload;

  if (category_id) {
    const isValidCategory = await isCategoryBelongToUser(user_id, category_id);

    if (!isValidCategory) {
      throw new AppError("Category is not belong to user", 401);
    }
  }

  const newBudget = await budgetRepo.createBudget(user_id, {
    title,
    description,
    category_id,
    amount,
    start_date,
    end_date,
  });

  return {
    newBudget,
  };
};

const updateBudget = async (user_id, id, payload) => {
  const isValidUser = await budgetRepo.isBudgetBelongToUser(user_id, id);

  if (!isValidUser) {
    throw new AppError("Budget is not belong to user", 401);
  }

  const { title, description, category_id, amount, start_date, end_date } =
    payload;

  if (category_id) {
    const isValidCategory = await isCategoryBelongToUser(user_id, category_id);

    if (!isValidCategory) {
      throw new AppError("Category is not belong to user", 401);
    }
  }

  const updatedBudget = await budgetRepo.updateBudget(user_id, id, {
    title,
    description,
    category_id,
    amount,
    start_date,
    end_date,
  });

  return {
    updatedBudget,
  };
};

const deleteBudget = async (user_id, id) => {
  const isValidUser = await budgetRepo.isBudgetBelongToUser(user_id, id);

  if (!isValidUser) {
    throw new AppError("Budget is not belong to user", 401);
  }

  const deletedBudget = await budgetRepo.deleteBudget(id);

  return {
    deletedBudget,
  };
};

const getBudgetProgress = async (user_id) => {
  const result = await budgetRepo.getBudgetProgress(user_id);

  const data = result.map((item) => ({
    id: item.id,
    title: item.title,
    amount: item.amount,
    spent: item.spent,
    remaining: item.amount - item.spent,
    precentage: (Number(item.spent) * 100) / item.amount,
  }));

  return {
    data,
  };
};

module.exports = {
  getBudgetByUser,
  getBudgetById,
  createBudget,
  updateBudget,
  deleteBudget,
  getBudgetProgress,
};

const AppError = require("../utils/app-error");

const budgetRepo = require("../repositories/budget.repository");

const {
  isCategoryBelongToUser,
} = require("../repositories/category.repository");

const getBudgetByUser = async (user_id, payload) => {
  const { page, limit } = payload;

  const offset = (page - 1) * limit;

  const result = await budgetRepo.getBudgetByUser(user_id, { limit, offset });

  const budgets = result.data.map((budget) => ({
    id: budget.id,
    userId: budget.user_id,
    title: budget.title,
    description: budget.description,
    categoryId: budget.category_id,
    amount: budget.amount,
    startDate: budget.start_date,
    endDate: budget.end_date,
    createdAt: budget.created_at,
    updatedAt: budget.updated_at,
  }));

  const totalPages = Math.ceil(result.total / limit);

  return {
    data: budgets,
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

const getBudgetById = async (user_id, id) => {
  const budget = await budgetRepo.getBudgetById(user_id, id);

  return {
    id: budget.id,
    userId: budget.user_id,
    title: budget.title,
    description: budget.description,
    categoryId: budget.category_id,
    amount: budget.amount,
    startDate: budget.start_date,
    endDate: budget.end_date,
    createdAt: budget.created_at,
    updatedAt: budget.updated_at,
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
    id: newBudget.id,
    userId: newBudget.user_id,
    title: newBudget.title,
    description: newBudget.description,
    categoryId: newBudget.category_id,
    amount: newBudget.amount,
    startDate: newBudget.start_date,
    endDate: newBudget.end_date,
    createdAt: newBudget.created_at,
    updatedAt: newBudget.updated_at,
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
    id: updatedBudget.id,
    userId: updatedBudget.user_id,
    title: updatedBudget.title,
    description: updatedBudget.description,
    categoryId: updatedBudget.category_id,
    amount: updatedBudget.amount,
    startDate: updatedBudget.start_date,
    endDate: updatedBudget.end_date,
    createdAt: updatedBudget.created_at,
    updatedAt: updatedBudget.updated_at,
  };
};

const deleteBudget = async (user_id, id) => {
  const isValidUser = await budgetRepo.isBudgetBelongToUser(user_id, id);

  if (!isValidUser) {
    throw new AppError("Budget is not belong to user", 401);
  }

  const deletedBudget = await budgetRepo.deleteBudget(id);

  return {
    id: deletedBudget.id,
    userId: deletedBudget.user_id,
    title: deletedBudget.title,
    description: deletedBudget.description,
    categoryId: deletedBudget.category_id,
    amount: deletedBudget.amount,
    startDate: deletedBudget.start_date,
    endDate: deletedBudget.end_date,
    createdAt: deletedBudget.created_at,
    updatedAt: deletedBudget.updated_at,
  };
};

module.exports = {
  getBudgetByUser,
  getBudgetById,
  createBudget,
  updateBudget,
  deleteBudget,
};

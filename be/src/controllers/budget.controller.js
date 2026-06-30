const { successResponse } = require("../utils/api-response");

const budgetService = require("../services/budget.service");

const getBudgetByUser = async (req, res, next) => {
  const user_id = req.user.id;

  const { page, limit } = req.validateQuery;

  const result = await budgetService.getBudgetByUser(user_id, { page, limit });

  return successResponse(
    res,
    "Get budgets successfully",
    result.data,
    200,
    result.metadata,
  );
};

const getBudgetById = async (req, res, next) => {
  const user_id = req.user.id;

  const id = req.params.id;

  const result = await budgetService.getBudgetById(user_id, id);

  return successResponse(res, "Get budget successfully", result);
};

const createBudget = async (req, res, next) => {
  const user_id = req.user.id;

  const { title, description, category_id, amount, start_date, end_date } =
    req.validateBody;

  const result = await budgetService.createBudget(user_id, {
    title,
    description,
    category_id,
    amount,
    start_date,
    end_date,
  });

  return successResponse(res, "Create budget successfully", result, 201);
};

const updateBudget = async (req, res, next) => {
  const user_id = req.user.id;

  const id = req.params.id;

  const { title, description, category_id, amount, start_date, end_date } =
    req.validateBody;

  const result = await budgetService.updateBudget(user_id, id, {
    title,
    description,
    category_id,
    amount,
    start_date,
    end_date,
  });

  return successResponse(res, "Update budget successfully", result);
};

const deleteBudget = async (req, res, next) => {
  const user_id = req.user.id;

  const id = req.params.id;

  const result = await budgetService.deleteBudget(user_id, id);

  return successResponse(res, "Delete budget successfully", result);
};

module.exports = {
  getBudgetByUser,
  getBudgetById,
  createBudget,
  updateBudget,
  deleteBudget,
};

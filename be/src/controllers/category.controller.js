const { successResponse } = require("../utils/api-response");
const AppError = require("../utils/app-error");

const categoryService = require("../services/category.service");

const getAllCategories = async (req, res, next) => {
  const { keyword, page, limit } = req.validateQuery;

  const user_id = req.user.id;

  const result = await categoryService.getAllCategories(user_id, {
    keyword,
    page,
    limit,
  });

  return successResponse(
    res,
    "Get categories successfully",
    result.data,
    200,
    result.metadata,
  );
};

const getCategoryById = async (req, res, next) => {
  const id = req.params.id;

  const user_id = req.user.id;

  const result = await categoryService.getCategoryById(user_id, id);

  if (!result) {
    throw new AppError("Category not found", 404);
  }

  return successResponse(res, "Get category successfully", result);
};

const createCategory = async (req, res, next) => {
  const { name, description } = req.validateBody;

  const user_id = req.user.id;

  const result = await categoryService.createCategory(user_id, {
    name,
    description,
  });

  return successResponse(res, "Create category successfully", result, 201);
};

const updateCategory = async (req, res, next) => {
  const { name, description } = req.validateBody;

  const id = req.params.id;

  const user_id = req.user.id;

  const result = await categoryService.updateCategory(user_id, id, {
    name,
    description,
  });

  return successResponse(res, "Updated category successfully", result);
};

const deleteCategory = async (req, res, next) => {
  const id = req.params.id;

  const user_id = req.user.id;

  const result = await categoryService.deleteCategory(user_id, id);

  return successResponse(res, "Deleted category successfully", result);
};

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};

const AppError = require("../utils/app-error");

const categoryRepo = require("../repositories/category.repository");

const getAllCategories = async (user_id, payload) => {
  const { page, limit, keyword } = payload;

  const offset = (page - 1) * limit;

  const categories = await categoryRepo.getAllCategories(user_id, {
    keyword,
    limit,
    offset,
  });

  const totalPages = Math.ceil(categories.total / limit);

  return {
    data: categories,
    metadata: {
      page,
      limit,
      totalItems: categories.total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
};

const getCategoryById = async (user_id, id) => {
  const isCategoryBelongToUser = await categoryRepo.isCategoryBelongToUser(
    user_id,
    id,
  );

  if (!isCategoryBelongToUser) {
    throw new AppError("Category not belong to user", 401);
  }

  const category = await categoryRepo.getCategoryById(id);

  return {
    category,
  };
};

const createCategory = async (user_id, payload) => {
  const { id, name, description } = payload;

  const newCategory = await categoryRepo.createCategory(user_id, {
    id,
    name,
    description,
  });

  return {
    newCategory,
  };
};

const updateCategory = async (user_id, id, payload) => {
  const { name, description } = payload;

  const isCategoryBelongToUser = await categoryRepo.isCategoryBelongToUser(
    user_id,
    id,
  );

  if (!isCategoryBelongToUser) {
    throw new AppError("Category not belong to user", 401);
  }

  const updatedCategory = await categoryRepo.updateCategory(id, {
    name,
    description,
  });

  return {
    updatedCategory,
  };
};

const deleteCategory = async (user_id, id) => {
  const isCategoryBelongToUser = await categoryRepo.isCategoryBelongToUser(
    user_id,
    id,
  );

  if (!isCategoryBelongToUser) {
    throw new AppError("Category not belong to user", 401);
  }

  const deletedCategory = await categoryRepo.deleteCategory(user_id, id);

  return {
    deletedCategory,
  };
};

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};

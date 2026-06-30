const AppError = require("../utils/app-error");

const categoryRepo = require("../repositories/category.repository");

const getAllCategories = async (user_id, payload) => {
  const { page, limit, keyword } = payload;

  const offset = (page - 1) * limit;

  const result = await categoryRepo.getAllCategories(user_id, {
    keyword,
    limit,
    offset,
  });

  const categories = result.data.map((category) => ({
    id: category.id,
    userId: category.user_id,
    name: category.name,
    description: category.description,
    createdAt: category.created_at,
    updatedAt: category.updated_at,
  }));

  const totalPages = Math.ceil(result.total / limit);

  return {
    data: categories,
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
    id: category.id,
    userId: category.user_id,
    name: category.name,
    description: category.description,
    createdAt: category.created_at,
    updatedAt: category.updated_at,
  };
};

const createCategory = async (user_id, payload) => {
  const { name, description } = payload;

  const newCategory = await categoryRepo.createCategory(user_id, {
    name,
    description,
  });

  return {
    id: newCategory.id,
    userId: newCategory.user_id,
    name: newCategory.name,
    description: newCategory.description,
    createdAt: newCategory.created_at,
    updatedAt: newCategory.updated_at,
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
    id: updatedCategory.id,
    userId: updatedCategory.user_id,
    name: updatedCategory.name,
    description: updatedCategory.description,
    createdAt: updatedCategory.created_at,
    updatedAt: updatedCategory.updated_at,
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
    id: deletedCategory.id,
    userId: deletedCategory.user_id,
    name: deletedCategory.name,
    description: deletedCategory.description,
    createdAt: deletedCategory.created_at,
    updatedAt: deletedCategory.updated_at,
    deletedAt: deletedCategory.deleted_at,
  };
};

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};

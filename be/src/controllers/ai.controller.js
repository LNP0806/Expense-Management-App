const { parseTransactionFromText } = require("../services/ai.service");
const categoryRepo = require("../repositories/category.repository");
const { successResponse } = require("../utils/api-response");

const parseText = async (req, res, next) => {
  try {
    const { text } = req.body;
    const user_id = req.user.id;

    const userCategories = await categoryRepo.findAllCategories(user_id);

    const categoryNames = userCategories.map((cat) => cat.name);

    const parseData = await parseTransactionFromText(text, categoryNames);

    const matchedCategory = userCategories.find(
      (cat) => cat.name === parseData.predicted_category,
    );

    const result = {
      ...parseData,
      category_id: matchedCategory ? matchedCategory.id : null,
    };

    return successResponse(res, "AI analytics successfully", result);
  } catch (error) {
    next(error);
  }
};

module.exports = { parseText };

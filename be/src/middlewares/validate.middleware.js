const AppError = require("../utils/app-error");

const formatZodError = (error) => {
  return error.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));
};

const validateBody = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const details = formatZodError(result.error);

      return next(new AppError("Validation failed", 400, details));
    }

    req.validateBody = result.data;

    next();
  };
};

const validateQuery = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      const details = formatZodError(result.error);

      return next(new AppError("Validation failed", 400, details));
    }

    req.validateBody = result.data;

    next();
  };
};

module.exports = {
  validateBody,
  validateQuery,
};

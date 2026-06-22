const AppError = require("../utils/app-error");

const notFoundMiddleware = (req, res, next) => {
  next(new AppError(`Router ${req.method} ${req.originalUrl} not found`, 404));
};

module.exports = notFoundMiddleware;
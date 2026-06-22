const errorMiddleware = (err, req, res, next) => {
  console.log(err);

  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error.";
  let details = err.details || null;

  if (err.code === "23505" && err.constraint === "users_email_key") {
    statusCode = 409;
    message = "Email already exists";
  }

  if (err.code === "23505") {
    statusCode = 409;
    message = "Duplicate value already exists";
  }

  if (err.code === "23503") {
    statusCode = 400;
    message = "Referenced record does not exists";
  }

  res.status(statusCode).json({
    success: false,
    message,
    details,
  });
};

module.exports = errorMiddleware;
const jwt = require("jsonwebtoken");
const AppError = require("../utils/app-error");
const pool = require("../config/db");

const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new AppError("Authentication token is required", 401));
    }

    const token = authHeader.split("")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const result = await pool.query(
      `SELECT id, email, fullname FROM users WHERE id = $1`,
      [decoded.id],
    );

    if (!user) {
      return next(new AppError("User is no longer exists", 404));
    }

    req.user = user;

    next();
  } catch (error) {
    next(new AppError("Invalid authentication token", 401));
  }
};

module.exports = requireAuth;

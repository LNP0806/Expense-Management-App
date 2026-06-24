const { successResponse } = require("../utils/api-response");
const authService = require("../services/auth.service");

const login = async (req, res, next) => {
  const { email, password } = req.validateBody;

  const result = await authService.login({ email, password });

  return successResponse(res, "User logged in successfully", result);
};

const register = async (req, res, next) => {
  const { fullname, email, password } = req.validateBody;

  const result = await authService.register({ fullname, email, password });

  return successResponse(res, "User registed successfully", result, 201);
};

module.exports = {
  login,
  register,
};

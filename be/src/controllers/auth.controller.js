const { successResponse } = require("../utils/api-response");
const authService = require("../services/auth.service");
const pool = require("../config/db");
const jwt = require("jsonwebtoken");

const login = async (req, res, next) => {
  const { email, password } = req.validateBody;

  const result = await authService.login({ email, password });

  if (result.refreshToken) {
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
  }

  return successResponse(res, "User logged in successfully", result);
};

const register = async (req, res, next) => {
  const { fullname, email, password } = req.validateBody;

  const result = await authService.register({ fullname, email, password });

  if (result.refreshToken) {
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
  }

  return successResponse(res, "User registed successfully", result, 201);
};

const handleRefreshToken = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
  if (!refreshToken)
    return res.status(401).json({ message: "Không tìm thấy Refresh Token" });

  try {
    // 1. Giải mã token xem có hợp lệ/hết hạn không
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || "fallback_refresh_secret",
    );

    // 2. Kiểm tra xem token này có trùng với token đang lưu trong DB không
    const { rows } = await pool.query(
      "SELECT * FROM users WHERE id = $1 AND refresh_token = $2",
      [decoded.id, refreshToken],
    );
    if (rows.length === 0)
      return res
        .status(403)
        .json({ message: "Token không hợp lệ hoặc đã bị vô hiệu hóa" });

    const user = rows[0];

    // 3. Cấp một Access Token mới tinh
    const accessToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "15m" },
    );

    return res.json({ accessToken });
  } catch (error) {
    return res
      .status(403)
      .json({ message: "Refresh Token đã hết hạn, vui lòng đăng nhập lại" });
  }
};

module.exports = {
  login,
  register,
  handleRefreshToken,
};

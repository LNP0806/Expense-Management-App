const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const AppError = require("../utils/app-error");

const userRepo = require("../repositories/user.repository");

const generateToken = (user) => {
  const accessToken = jwt.sign(
    {
      id: user.id,
      email: user.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "15m",
    },
  );

  const refreshToken = jwt.sign(
    {
      id: user.id,
      email: user.email,
    },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
    },
  );

  return { accessToken, refreshToken };
};

const login = async (payload) => {
  const user = await userRepo.getUserbyEmail(payload.email);

  if (!user) {
    throw new AppError("Invalid email or password", 404);
  }

  const isPasswordCorrect = await bcrypt.compare(
    payload.password.trim(),
    user.password,
  );

  if (!isPasswordCorrect) {
    throw new AppError("Invalid email or password", 404);
  }

  const { accessToken, refreshToken } = generateToken(user);

  await userRepo.updateRefreshToken(user.id, refreshToken);

  return {
    user,
    accessToken,
    refreshToken,
  };
};

const register = async (payload) => {
  const { email } = payload;

  const isExistingUser = await userRepo.getUserbyEmail(email);

  if (isExistingUser) {
    throw new AppError("Email already exists", 409);
  }

  const password = await bcrypt.hash(payload.password.trim(), 10);

  const newUser = await userRepo.createUser({
    fullname: payload.fullname,
    email,
    password,
  });

  const { accessToken, refreshToken } = generateToken(newUser);

  await userRepo.updateRefreshToken(newUser.id, refreshToken);

  return {
    user: newUser,
    accessToken,
    refreshToken,
  };
};

module.exports = {
  login,
  register,
};

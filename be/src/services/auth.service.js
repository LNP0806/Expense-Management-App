const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const AppError = require("../utils/app-error");

const userRepo = require("../repositories/user.repository");

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    },
  );
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

  const token = generateToken(user);

  return {
    user: {
      id: user.id,
      fullname: user.fullname,
      email: user.email,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    },
    token,
  };
};

const register = async (payload) => {
  const { email } = payload;

  const isExistingUser = await userRepo.getUserbyEmail(email);

  if (isExistingUser) {
    throw new AppError("Email already exists", 409);
  }

  const password = await bcrypt.hash(payload.password.trim(), 10);

  const newUser = await userRepo.createUser({ fullname: payload.fullname, email, password });

  const token = generateToken(newUser);

  return {
    user: {
      id: newUser.id,
      fullname: newUser.fullname,
      email: newUser.email,
      createdAt: newUser.created_at,
      updatedAt: newUser.updated_at,
    },
    token,
  }
}

module.exports = {
  login,
  register,
}
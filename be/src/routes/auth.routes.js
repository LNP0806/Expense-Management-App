const express = require("express");

const asyncHandler = require("../middlewares/async-handler.middleware");
const authController = require("../controllers/auth.controller");
const { validateBody } = require("../middlewares/validate.middleware");
const { registerSchema, loginSchema } = require("../schemas/auth.schema");

const router = express.Router();

router.post(
  "/login",
  validateBody(loginSchema),
  asyncHandler(authController.login),
);

router.post(
  "/register",
  validateBody(registerSchema),
  asyncHandler(authController.register),
);

module.exports = router;

const express = require("express");
const aiController = require("../controllers/ai.controller");
// Bạn có thể gắn thêm authMiddleware ở đây nếu bắt buộc đăng nhập mới được xài chatbot
const requireAuth = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(requireAuth);

router.post("/parse-transaction", aiController.parseText);

module.exports = router;

const express = require("express");
const asyncHandler = require("../middlewares/async-handler.middleware");
const requireAuth = require("../middlewares/auth.middleware");
const syncController = require("../controllers/sync.controller");

const router = express.Router();

router.get("/", requireAuth, asyncHandler(syncController.syncData));

module.exports = router;

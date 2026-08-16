const express = require("express");
const { login, getMe, updateMe } = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/login", login);
router.get("/me", authMiddleware, getMe);
router.patch("/me", authMiddleware, updateMe);
router.put("/me", authMiddleware, updateMe);

module.exports = router;

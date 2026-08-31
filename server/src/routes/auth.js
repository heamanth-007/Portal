const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { registerValidation, loginValidation } = require("../middlewares/validate");
const auth = require("../middlewares/auth");
const { isAdmin } = require("../middlewares/role");

// Register - admin only
router.post("/register", auth, isAdmin, registerValidation, authController.register);
// Login
router.post("/login", loginValidation, authController.login);
// me
router.get("/me", auth, authController.me);

module.exports = router;

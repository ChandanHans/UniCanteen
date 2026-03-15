const { Router } = require("express");
const { register, login, refresh, getMe, updateMe, logout } = require("../controllers/auth.controller");
const { authenticate } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { registerSchema, loginSchema, updateProfileSchema } = require("../validators/auth.validator");

const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", authenticate, getMe);
router.put("/me", authenticate, validate(updateProfileSchema), updateMe);

module.exports = router;

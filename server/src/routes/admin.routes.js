const { Router } = require("express");
const {
  getDashboard, getUsers, updateUserRole, toggleUserStatus,
  getHostels, createHostel, updateHostel,
} = require("../controllers/admin.controller");
const { authenticate, authorize } = require("../middleware/auth");

const router = Router();

router.use(authenticate, authorize("SUPER_ADMIN"));

router.get("/dashboard", getDashboard);
router.get("/users", getUsers);
router.patch("/users/:id/role", updateUserRole);
router.patch("/users/:id/status", toggleUserStatus);
router.get("/hostels", getHostels);
router.post("/hostels", createHostel);
router.put("/hostels/:id", updateHostel);

module.exports = router;

const { Router } = require("express");
const { getNotifications, markAsRead, markAllAsRead } = require("../controllers/notification.controller");
const { authenticate } = require("../middleware/auth");

const router = Router();

router.use(authenticate);

router.get("/", getNotifications);
router.patch("/read-all", markAllAsRead);
router.patch("/:id/read", markAsRead);

module.exports = router;

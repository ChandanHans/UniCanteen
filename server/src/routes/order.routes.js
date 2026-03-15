const { Router } = require("express");
const {
  createOrder, verifyPayment,
  getMyOrders, getOrderById, updateOrderStatus,
  cancelOrder, getCanteenOrders, getOrderStats,
} = require("../controllers/order.controller");
const { authenticate, authorize } = require("../middleware/auth");
const validate = require("../middleware/validate");
const {
  createOrderSchema, updateOrderStatusSchema, verifyPaymentSchema,
} = require("../validators/order.validator");

const router = Router();

router.use(authenticate);

// Student routes
router.post("/", authorize("STUDENT"), validate(createOrderSchema), createOrder);
router.get("/", authorize("STUDENT"), getMyOrders);
router.post("/:id/verify-payment", authorize("STUDENT"), validate(verifyPaymentSchema), verifyPayment);
router.post("/:id/cancel", authorize("STUDENT"), cancelOrder);

// Canteen admin routes
router.get("/admin", authorize("CANTEEN_ADMIN"), getCanteenOrders);
router.get("/admin/stats", authorize("CANTEEN_ADMIN"), getOrderStats);
router.patch("/:id/status", authorize("CANTEEN_ADMIN"), validate(updateOrderStatusSchema), updateOrderStatus);

// Shared
router.get("/:id", getOrderById);

module.exports = router;

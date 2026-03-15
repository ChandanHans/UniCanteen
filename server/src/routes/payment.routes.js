const { Router } = require("express");
const { getPaymentByOrder } = require("../controllers/payment.controller");
const { authenticate } = require("../middleware/auth");

const router = Router();

router.get("/:orderId", authenticate, getPaymentByOrder);

module.exports = router;

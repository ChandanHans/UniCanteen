const prisma = require("../config/db");
const { success, error } = require("../utils/apiResponse");

async function getPaymentByOrder(req, res, next) {
  try {
    const payment = await prisma.payment.findUnique({
      where: { orderId: req.params.orderId },
    });
    if (!payment) return error(res, "Payment not found", 404);
    return success(res, payment);
  } catch (err) {
    next(err);
  }
}

module.exports = { getPaymentByOrder };

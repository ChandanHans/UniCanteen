const prisma = require("../config/db");
const { getIO } = require("../config/socket");
const { success, error } = require("../utils/apiResponse");
const crypto = require("crypto");

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

// Razorpay webhook — receives raw body for HMAC verification
async function razorpayWebhook(req, res) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret || webhookSecret.startsWith('xxx')) {
    // Webhook not configured — skip silently in dev/test
    return res.json({ status: "ok" });
  }

  const signature = req.headers["x-razorpay-signature"];
  if (!signature) return res.status(400).json({ message: "Missing signature" });

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(req.body) // raw Buffer
    .digest("hex");

  if (expectedSignature !== signature) {
    return res.status(400).json({ message: "Invalid webhook signature" });
  }

  let event;
  try {
    event = JSON.parse(req.body.toString());
  } catch {
    return res.status(400).json({ message: "Invalid JSON payload" });
  }

  if (event.event === "payment.captured") {
    const { order_id, id: paymentId } = event.payload.payment.entity;

    try {
      const payment = await prisma.payment.findUnique({
        where: { rzpOrderId: order_id },
        include: { order: true },
      });

      if (!payment || payment.status === "SUCCESS") {
        return res.json({ status: "ok" }); // already processed or unknown
      }

      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { rzpOrderId: order_id },
          data: { status: "SUCCESS", rzpPaymentId: paymentId },
        });
        await tx.order.update({
          where: { id: payment.orderId },
          data: { status: "CONFIRMED" },
        });
        await tx.notification.create({
          data: {
            userId: payment.order.userId,
            title: "Payment Confirmed",
            message: `Payment for order ${payment.order.orderNumber} confirmed! Pick up your food.`,
            type: "ORDER_UPDATE",
            data: { orderId: payment.orderId },
          },
        });
      });

      try {
        const io = getIO();
        io.to(`user:${payment.order.userId}`)
          .to(`order:${payment.orderId}`)
          .emit("order:statusUpdate", {
            orderId: payment.orderId,
            orderNumber: payment.order.orderNumber,
            status: "CONFIRMED",
          });
        io.to(`canteen:${payment.order.canteenId}`).emit("order:new", {
          orderId: payment.orderId,
          orderNumber: payment.order.orderNumber,
        });
      } catch {}
    } catch (err) {
      console.error("Webhook processing error:", err);
      return res.status(500).json({ message: "Webhook processing failed" });
    }
  }

  if (event.event === "payment.failed") {
    const { order_id } = event.payload.payment.entity;
    try {
      const payment = await prisma.payment.findUnique({ where: { rzpOrderId: order_id } });
      if (payment && payment.status === "PENDING") {
        await prisma.payment.update({
          where: { rzpOrderId: order_id },
          data: { status: "FAILED" },
        });
      }
    } catch {}
  }

  return res.json({ status: "ok" });
}

module.exports = { getPaymentByOrder, razorpayWebhook };

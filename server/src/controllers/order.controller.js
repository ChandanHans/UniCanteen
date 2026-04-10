const prisma = require("../config/db");
const { getIO } = require("../config/socket");
const { success, error } = require("../utils/apiResponse");
const Cashfree = require("../config/cashfree");
const crypto = require("crypto");

function generateOrderNumber() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `ORD-${date}-${rand}`;
}

async function createOrder(req, res, next) {
  try {
    const userId = req.user.userId;
    const { specialInstructions, meal } = req.body;

    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: {
        menuItem: {
          include: { category: { select: { canteenId: true } } },
        },
      },
    });

    if (cartItems.length === 0) {
      return error(res, "Cart is empty", 400);
    }

    const unavailable = cartItems.filter((ci) => !ci.menuItem.isAvailable);
    if (unavailable.length > 0) {
      return error(
        res,
        `These items are no longer available: ${unavailable.map((u) => u.menuItem.name).join(", ")}`,
        400
      );
    }

    const canteenId = cartItems[0].menuItem.category.canteenId;
    const totalAmount = cartItems.reduce(
      (sum, ci) => sum + Number(ci.menuItem.price) * ci.quantity,
      0
    );

    const canteen = await prisma.canteen.findUnique({
      where: { id: canteenId },
      select: { name: true },
    });

    // Fetch user details needed for Cashfree customer object
    const userRecord = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, phone: true },
    });

    // Step 1: Create order + payment in DB (do NOT clear cart yet)
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId,
          canteenId,
          totalAmount,
          specialInstructions,
          meal,
          items: {
            create: cartItems.map((ci) => ({
              menuItemId: ci.menuItemId,
              quantity: ci.quantity,
              unitPrice: ci.menuItem.price,
              itemName: ci.menuItem.name,
            })),
          },
          payment: {
            create: { amount: totalAmount },
          },
        },
        include: { items: true, payment: true },
      });

      return newOrder;
    });

    // Step 2: Create Cashfree order
    let cfOrder;
    try {
      const orderRequest = {
        order_id: order.orderNumber,
        order_amount: totalAmount,
        order_currency: "INR",
        customer_details: {
          customer_id: userId,
          customer_name: userRecord.name,
          customer_email: userRecord.email,
          customer_phone: userRecord.phone?.replace(/^\+?91/, "").slice(-10) || "9999999999",
        },
        order_meta: {
          return_url: `${process.env.CLIENT_URL}/checkout?cf_order_id=${order.orderNumber}&payment_status={payment_status}`,
        },
      };
      const response = await Cashfree.PGCreateOrder(orderRequest);
      cfOrder = response.data;
    } catch (cfErr) {
      // Delete the pending order so cart stays intact
      await prisma.$transaction([
        prisma.payment.delete({ where: { orderId: order.id } }),
        prisma.order.delete({ where: { id: order.id } }),
      ]);
      return error(res, "Payment gateway unavailable. Please try again.", 503);
    }

    // Step 3: Store Cashfree order ID and clear cart atomically
    await prisma.$transaction([
      prisma.payment.update({
        where: { orderId: order.id },
        data: { rzpOrderId: cfOrder.cf_order_id.toString() },
      }),
      prisma.cartItem.deleteMany({ where: { userId } }),
    ]);

    return success(res, {
      order,
      paymentSessionId: cfOrder.payment_session_id,
      cfOrderId: cfOrder.cf_order_id,
      canteenName: canteen?.name,
    }, "Order created. Please complete payment.", 201);
  } catch (err) {
    next(err);
  }
}

// Student calls this after Cashfree checkout completes
async function verifyPayment(req, res, next) {
  try {
    const { cf_order_id } = req.body;

    const payment = await prisma.payment.findUnique({
      where: { rzpOrderId: cf_order_id.toString() },
      include: { order: true },
    });

    if (!payment) return error(res, "Payment record not found", 404);
    if (payment.order.userId !== req.user.userId) return error(res, "Access denied", 403);
    if (payment.status === "SUCCESS") return error(res, "Payment already verified", 400);

    // Fetch order status from Cashfree
    let cfOrder;
    try {
      const response = await Cashfree.PGFetchOrder(payment.order.orderNumber, undefined, undefined);
      cfOrder = response.data;
    } catch (cfErr) {
      return error(res, "Could not verify payment with gateway", 502);
    }

    if (cfOrder.order_status !== "PAID") {
      return error(res, `Payment not completed. Status: ${cfOrder.order_status}`, 400);
    }

    // Get cf_payment_id from payments list
    let cfPaymentId = null;
    try {
      const paymentsRes = await Cashfree.PGOrderFetchPayments(payment.order.orderNumber, undefined, undefined);
      const paid = paymentsRes.data?.find((p) => p.payment_status === "SUCCESS");
      cfPaymentId = paid?.cf_payment_id?.toString() || null;
    } catch {}

    // Mark payment SUCCESS + order CONFIRMED
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: "SUCCESS", rzpPaymentId: cfPaymentId },
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

    return success(res, null, "Payment verified. Order confirmed.");
  } catch (err) {
    next(err);
  }
}

async function getMyOrders(req, res, next) {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const where = { userId: req.user.userId };
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: true,
          canteen: { select: { id: true, name: true } },
          payment: { select: { status: true, rzpPaymentId: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: parseInt(limit),
      }),
      prisma.order.count({ where }),
    ]);

    return success(res, { orders, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
}

async function getOrderById(req, res, next) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        items: { include: { menuItem: { select: { imageUrl: true } } } },
        canteen: { select: { id: true, name: true } },
        payment: true,
        user: { select: { id: true, name: true, phone: true } },
      },
    });
    if (!order) return error(res, "Order not found", 404);

    if (req.user.role === "STUDENT" && order.userId !== req.user.userId) {
      return error(res, "Access denied", 403);
    }

    return success(res, order);
  } catch (err) {
    next(err);
  }
}

async function updateOrderStatus(req, res, next) {
  try {
    const { status } = req.body;

    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status },
      include: { user: { select: { id: true, name: true } } },
    });

    try {
      const io = getIO();
      io.to(`user:${order.userId}`).to(`order:${order.id}`).emit("order:statusUpdate", {
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
      });
    } catch {}

    await prisma.notification.create({
      data: {
        userId: order.userId,
        title: "Order Update",
        message: `Your order ${order.orderNumber} is now ${status.replace("_", " ").toLowerCase()}`,
        type: "ORDER_UPDATE",
        data: { orderId: order.id },
      },
    });

    return success(res, order, "Order status updated");
  } catch (err) {
    next(err);
  }
}

async function cancelOrder(req, res, next) {
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) return error(res, "Order not found", 404);
    if (order.userId !== req.user.userId) return error(res, "Access denied", 403);
    if (order.status !== "PLACED") {
      return error(res, "Can only cancel orders that are not yet confirmed", 400);
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } });
      await tx.payment.update({ where: { orderId: order.id }, data: { status: "FAILED" } });
    });

    return success(res, null, "Order cancelled");
  } catch (err) {
    next(err);
  }
}

async function getCanteenOrders(req, res, next) {
  try {
    const admin = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { managedCanteen: true },
    });
    if (!admin?.managedCanteen) return error(res, "No canteen assigned", 403);

    const { status, page = 1, limit = 20 } = req.query;
    const where = { canteenId: admin.managedCanteen.id };
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: true,
          user: { select: { id: true, name: true, phone: true } },
          payment: { select: { status: true, rzpPaymentId: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: parseInt(limit),
      }),
      prisma.order.count({ where }),
    ]);

    return success(res, { orders, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
}

async function getOrderStats(req, res, next) {
  try {
    const admin = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { managedCanteen: true },
    });
    if (!admin?.managedCanteen) return error(res, "No canteen assigned", 403);

    const canteenId = admin.managedCanteen.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayOrders, todayRevenue, activeOrders, totalOrders] = await Promise.all([
      prisma.order.count({ where: { canteenId, createdAt: { gte: today } } }),
      prisma.order.aggregate({
        where: { canteenId, createdAt: { gte: today }, payment: { status: "SUCCESS" } },
        _sum: { totalAmount: true },
      }),
      prisma.order.count({
        where: { canteenId, status: { in: ["CONFIRMED"] } },
      }),
      prisma.order.count({ where: { canteenId } }),
    ]);

    return success(res, {
      todayOrders,
      todayRevenue: todayRevenue._sum.totalAmount || 0,
      activeOrders,
      totalOrders,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createOrder, verifyPayment,
  getMyOrders, getOrderById, updateOrderStatus,
  cancelOrder, getCanteenOrders, getOrderStats,
};

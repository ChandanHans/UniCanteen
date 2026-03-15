const { z } = require("zod");

const createOrderSchema = z.object({
  specialInstructions: z.string().max(500).optional(),
  meal: z.enum(["LUNCH", "DINNER"]),
});

const updateOrderStatusSchema = z.object({
  status: z.enum(["CONFIRMED", "PICKED_UP", "CANCELLED"]),
});

const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

module.exports = { createOrderSchema, updateOrderStatusSchema, verifyPaymentSchema };

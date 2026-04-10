const { z } = require("zod");

const createOrderSchema = z.object({
  specialInstructions: z.string().max(500).optional(),
  meal: z.enum(["LUNCH", "DINNER"]),
});

const updateOrderStatusSchema = z.object({
  status: z.enum(["CONFIRMED", "PICKED_UP", "CANCELLED"]),
});

const verifyPaymentSchema = z.object({
  cf_order_id: z.union([z.string(), z.number()]).transform(String),
});

module.exports = { createOrderSchema, updateOrderStatusSchema, verifyPaymentSchema };

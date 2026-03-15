const { z } = require("zod");

const createReviewSchema = z.object({
  menuItemId: z.string().uuid("Invalid menu item ID"),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().max(500).optional(),
});

module.exports = { createReviewSchema, updateReviewSchema };

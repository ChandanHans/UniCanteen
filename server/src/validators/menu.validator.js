const { z } = require("zod");

const createCategorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  sortOrder: z.number().int().optional(),
});

const createMenuItemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  description: z.string().optional(),
  price: z.number().positive("Price must be positive"),
  categoryId: z.string().uuid("Invalid category ID"),
  isVeg: z.boolean().optional(),
  isAvailable: z.boolean().optional(),
  prepTime: z.number().int().positive().optional(),
});

const updateMenuItemSchema = createMenuItemSchema.partial();

module.exports = { createCategorySchema, createMenuItemSchema, updateMenuItemSchema };

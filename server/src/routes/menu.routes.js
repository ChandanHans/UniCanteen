const { Router } = require("express");
const {
  getMenu, getFullMenu, createCategory, updateCategory, deleteCategory,
  createMenuItem, updateMenuItem, toggleAvailability, deleteMenuItem,
  searchMenuItems, updateDailyMenu,
} = require("../controllers/menu.controller");
const { authenticate, authorize } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { createCategorySchema, createMenuItemSchema, updateMenuItemSchema } = require("../validators/menu.validator");
const upload = require("../middleware/upload");

const router = Router();

// Search
router.get("/search", searchMenuItems);

// Menu by canteen (only available items — for students)
router.get("/canteen/:canteenId", getMenu);

// Full menu (all items — for admin daily menu management)
router.get("/canteen/:canteenId/full", authenticate, authorize("CANTEEN_ADMIN"), getFullMenu);

// Daily menu bulk toggle
router.put("/daily", authenticate, authorize("CANTEEN_ADMIN"), updateDailyMenu);

// Categories
router.post(
  "/canteen/:canteenId/categories",
  authenticate, authorize("CANTEEN_ADMIN"), validate(createCategorySchema), createCategory
);
router.put("/categories/:id", authenticate, authorize("CANTEEN_ADMIN"), updateCategory);
router.delete("/categories/:id", authenticate, authorize("CANTEEN_ADMIN"), deleteCategory);

// Items
router.post(
  "/items",
  authenticate, authorize("CANTEEN_ADMIN"), upload.single("image"), createMenuItem
);
router.put(
  "/items/:id",
  authenticate, authorize("CANTEEN_ADMIN"), upload.single("image"), updateMenuItem
);
router.patch("/items/:id/availability", authenticate, authorize("CANTEEN_ADMIN"), toggleAvailability);
router.delete("/items/:id", authenticate, authorize("CANTEEN_ADMIN"), deleteMenuItem);

module.exports = router;

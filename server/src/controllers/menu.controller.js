const prisma = require("../config/db");
const cloudinary = require("../config/cloudinary");
const { success, error } = require("../utils/apiResponse");

// ─── Categories ──────────────────────────────────────────

async function getMenu(req, res, next) {
  try {
    const categories = await prisma.menuCategory.findMany({
      where: { canteenId: req.params.canteenId },
      orderBy: { sortOrder: "asc" },
      include: {
        items: { orderBy: { name: "asc" } },
      },
    });
    return success(res, categories);
  } catch (err) {
    next(err);
  }
}

async function createCategory(req, res, next) {
  try {
    const category = await prisma.menuCategory.create({
      data: {
        name: req.body.name,
        canteenId: req.params.canteenId,
        sortOrder: req.body.sortOrder || 0,
      },
    });
    return success(res, category, "Category created", 201);
  } catch (err) {
    next(err);
  }
}

async function updateCategory(req, res, next) {
  try {
    const category = await prisma.menuCategory.update({
      where: { id: req.params.id },
      data: req.body,
    });
    return success(res, category, "Category updated");
  } catch (err) {
    next(err);
  }
}

async function deleteCategory(req, res, next) {
  try {
    await prisma.menuCategory.delete({ where: { id: req.params.id } });
    return success(res, null, "Category deleted");
  } catch (err) {
    next(err);
  }
}

// ─── Menu Items ──────────────────────────────────────────

async function createMenuItem(req, res, next) {
  try {
    let imageUrl = null;
    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "canteen-menu" },
          (err, result) => (err ? reject(err) : resolve(result))
        );
        stream.end(req.file.buffer);
      });
      imageUrl = result.secure_url;
    }

    const item = await prisma.menuItem.create({
      data: {
        ...req.body,
        price: parseFloat(req.body.price),
        imageUrl,
        categoryId: req.params.categoryId || req.body.categoryId,
      },
    });
    return success(res, item, "Menu item created", 201);
  } catch (err) {
    next(err);
  }
}

async function updateMenuItem(req, res, next) {
  try {
    let imageUrl;
    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "canteen-menu" },
          (err, result) => (err ? reject(err) : resolve(result))
        );
        stream.end(req.file.buffer);
      });
      imageUrl = result.secure_url;
    }

    const data = { ...req.body };
    if (data.price) data.price = parseFloat(data.price);
    if (imageUrl) data.imageUrl = imageUrl;

    const item = await prisma.menuItem.update({
      where: { id: req.params.id },
      data,
    });
    return success(res, item, "Menu item updated");
  } catch (err) {
    next(err);
  }
}

async function toggleAvailability(req, res, next) {
  try {
    const item = await prisma.menuItem.findUnique({ where: { id: req.params.id } });
    if (!item) return error(res, "Menu item not found", 404);

    const updated = await prisma.menuItem.update({
      where: { id: req.params.id },
      data: { isAvailable: !item.isAvailable },
    });
    return success(res, updated, `Item ${updated.isAvailable ? "available" : "unavailable"}`);
  } catch (err) {
    next(err);
  }
}

async function deleteMenuItem(req, res, next) {
  try {
    await prisma.menuItem.delete({ where: { id: req.params.id } });
    return success(res, null, "Menu item deleted");
  } catch (err) {
    next(err);
  }
}

async function searchMenuItems(req, res, next) {
  try {
    const { q, canteenId } = req.query;
    const where = {
      name: { contains: q || "", mode: "insensitive" },
      isAvailable: true,
    };
    if (canteenId) {
      where.category = { canteenId };
    }

    const items = await prisma.menuItem.findMany({
      where,
      include: {
        category: {
          include: { canteen: { select: { id: true, name: true } } },
        },
      },
      take: 20,
    });
    return success(res, items);
  } catch (err) {
    next(err);
  }
}

// ─── Daily Menu (Bulk toggle) ────────────────────────────

async function updateDailyMenu(req, res, next) {
  try {
    const { availableItemIds } = req.body; // array of item IDs that are in today's menu

    // Get admin's canteen
    const admin = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { managedCanteen: { include: { categories: { select: { id: true } } } } },
    });
    if (!admin?.managedCanteen) return error(res, "No canteen assigned", 403);

    const categoryIds = admin.managedCanteen.categories.map((c) => c.id);

    // Set all items in this canteen to unavailable, then enable selected ones
    await prisma.$transaction([
      prisma.menuItem.updateMany({
        where: { categoryId: { in: categoryIds } },
        data: { isAvailable: false },
      }),
      ...(availableItemIds.length > 0
        ? [
            prisma.menuItem.updateMany({
              where: { id: { in: availableItemIds }, categoryId: { in: categoryIds } },
              data: { isAvailable: true },
            }),
          ]
        : []),
    ]);

    return success(res, null, "Today's menu updated");
  } catch (err) {
    next(err);
  }
}

// Get ALL items (available + unavailable) for admin's daily menu management
async function getFullMenu(req, res, next) {
  try {
    const categories = await prisma.menuCategory.findMany({
      where: { canteenId: req.params.canteenId },
      orderBy: { sortOrder: "asc" },
      include: {
        items: { orderBy: { name: "asc" } }, // includes unavailable items too
      },
    });
    return success(res, categories);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMenu, getFullMenu, createCategory, updateCategory, deleteCategory,
  createMenuItem, updateMenuItem, toggleAvailability, deleteMenuItem,
  searchMenuItems, updateDailyMenu,
};

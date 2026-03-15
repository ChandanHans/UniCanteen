const prisma = require("../config/db");
const { success, error } = require("../utils/apiResponse");

async function getCart(req, res, next) {
  try {
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: req.user.userId },
      include: {
        menuItem: {
          include: {
            category: {
              include: { canteen: { select: { id: true, name: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const total = cartItems.reduce(
      (sum, item) => sum + Number(item.menuItem.price) * item.quantity,
      0
    );

    return success(res, { items: cartItems, total });
  } catch (err) {
    next(err);
  }
}

async function addToCart(req, res, next) {
  try {
    const { menuItemId, quantity = 1 } = req.body;

    // Get the menu item with its canteen
    const menuItem = await prisma.menuItem.findUnique({
      where: { id: menuItemId },
      include: { category: { select: { canteenId: true } } },
    });
    if (!menuItem) return error(res, "Menu item not found", 404);
    if (!menuItem.isAvailable) return error(res, "Item is not available", 400);

    // Check if cart has items from a different canteen
    const existingCart = await prisma.cartItem.findFirst({
      where: { userId: req.user.userId },
      include: { menuItem: { include: { category: { select: { canteenId: true } } } } },
    });

    if (existingCart && existingCart.menuItem.category.canteenId !== menuItem.category.canteenId) {
      return error(
        res,
        "Your cart has items from another canteen. Please clear your cart first.",
        409
      );
    }

    // Upsert: add or update quantity
    const cartItem = await prisma.cartItem.upsert({
      where: {
        userId_menuItemId: { userId: req.user.userId, menuItemId },
      },
      update: { quantity: { increment: quantity } },
      create: { userId: req.user.userId, menuItemId, quantity },
      include: { menuItem: true },
    });

    return success(res, cartItem, "Added to cart");
  } catch (err) {
    next(err);
  }
}

async function updateCartItem(req, res, next) {
  try {
    const { quantity } = req.body;
    if (quantity < 1) {
      await prisma.cartItem.delete({ where: { id: req.params.cartItemId } });
      return success(res, null, "Item removed from cart");
    }

    const cartItem = await prisma.cartItem.update({
      where: { id: req.params.cartItemId },
      data: { quantity },
      include: { menuItem: true },
    });
    return success(res, cartItem, "Cart updated");
  } catch (err) {
    next(err);
  }
}

async function removeCartItem(req, res, next) {
  try {
    await prisma.cartItem.delete({ where: { id: req.params.cartItemId } });
    return success(res, null, "Item removed from cart");
  } catch (err) {
    next(err);
  }
}

async function clearCart(req, res, next) {
  try {
    await prisma.cartItem.deleteMany({ where: { userId: req.user.userId } });
    return success(res, null, "Cart cleared");
  } catch (err) {
    next(err);
  }
}

module.exports = { getCart, addToCart, updateCartItem, removeCartItem, clearCart };

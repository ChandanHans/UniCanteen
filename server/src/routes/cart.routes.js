const { Router } = require("express");
const { getCart, addToCart, updateCartItem, removeCartItem, clearCart } = require("../controllers/cart.controller");
const { authenticate, authorize } = require("../middleware/auth");

const router = Router();

router.use(authenticate, authorize("STUDENT"));

router.get("/", getCart);
router.post("/", addToCart);
router.put("/:cartItemId", updateCartItem);
router.delete("/clear", clearCart);
router.delete("/:cartItemId", removeCartItem);

module.exports = router;

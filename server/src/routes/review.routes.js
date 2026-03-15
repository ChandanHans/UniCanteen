const { Router } = require("express");
const { createReview, updateReview, getItemReviews, deleteReview } = require("../controllers/review.controller");
const { authenticate } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { createReviewSchema, updateReviewSchema } = require("../validators/review.validator");

const router = Router();

router.get("/item/:menuItemId", getItemReviews);
router.post("/", authenticate, validate(createReviewSchema), createReview);
router.put("/:id", authenticate, validate(updateReviewSchema), updateReview);
router.delete("/:id", authenticate, deleteReview);

module.exports = router;

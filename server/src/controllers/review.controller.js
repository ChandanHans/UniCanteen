const prisma = require("../config/db");
const { success, error } = require("../utils/apiResponse");

async function createReview(req, res, next) {
  try {
    const { menuItemId, rating, comment } = req.body;

    const review = await prisma.review.create({
      data: {
        userId: req.user.userId,
        menuItemId,
        rating,
        comment,
      },
      include: { user: { select: { id: true, name: true } } },
    });
    return success(res, review, "Review submitted", 201);
  } catch (err) {
    next(err);
  }
}

async function updateReview(req, res, next) {
  try {
    const review = await prisma.review.findUnique({ where: { id: req.params.id } });
    if (!review) return error(res, "Review not found", 404);
    if (review.userId !== req.user.userId) return error(res, "Access denied", 403);

    const updated = await prisma.review.update({
      where: { id: req.params.id },
      data: req.body,
      include: { user: { select: { id: true, name: true } } },
    });
    return success(res, updated, "Review updated");
  } catch (err) {
    next(err);
  }
}

async function getItemReviews(req, res, next) {
  try {
    const reviews = await prisma.review.findMany({
      where: { menuItemId: req.params.menuItemId },
      include: { user: { select: { id: true, name: true, avatarUrl: true } } },
      orderBy: { createdAt: "desc" },
    });

    const avgRating = reviews.length
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    return success(res, { reviews, avgRating, totalReviews: reviews.length });
  } catch (err) {
    next(err);
  }
}

async function deleteReview(req, res, next) {
  try {
    const review = await prisma.review.findUnique({ where: { id: req.params.id } });
    if (!review) return error(res, "Review not found", 404);
    if (review.userId !== req.user.userId && req.user.role === "STUDENT") {
      return error(res, "Access denied", 403);
    }

    await prisma.review.delete({ where: { id: req.params.id } });
    return success(res, null, "Review deleted");
  } catch (err) {
    next(err);
  }
}

module.exports = { createReview, updateReview, getItemReviews, deleteReview };

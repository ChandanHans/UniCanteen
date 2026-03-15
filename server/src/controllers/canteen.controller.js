const prisma = require("../config/db");
const { success, error } = require("../utils/apiResponse");

async function getAllCanteens(req, res, next) {
  try {
    const canteens = await prisma.canteen.findMany({
      include: {
        hostel: true,
        _count: { select: { categories: true } },
      },
      orderBy: { name: "asc" },
    });
    return success(res, canteens);
  } catch (err) {
    next(err);
  }
}

async function getCanteenById(req, res, next) {
  try {
    const canteen = await prisma.canteen.findUnique({
      where: { id: req.params.id },
      include: {
        hostel: true,
        categories: {
          orderBy: { sortOrder: "asc" },
          include: {
            items: {
              where: { isAvailable: true },
              orderBy: { name: "asc" },
            },
          },
        },
      },
    });
    if (!canteen) {
      return error(res, "Canteen not found", 404);
    }
    return success(res, canteen);
  } catch (err) {
    next(err);
  }
}

async function createCanteen(req, res, next) {
  try {
    const { name, hostelId, adminId, description, lunchStart, lunchEnd, dinnerStart, dinnerEnd } = req.body;
    const canteen = await prisma.canteen.create({
      data: { name, hostelId, adminId, description, lunchStart, lunchEnd, dinnerStart, dinnerEnd },
      include: { hostel: true },
    });
    return success(res, canteen, "Canteen created", 201);
  } catch (err) {
    next(err);
  }
}

async function updateCanteen(req, res, next) {
  try {
    const canteen = await prisma.canteen.update({
      where: { id: req.params.id },
      data: req.body,
      include: { hostel: true },
    });
    return success(res, canteen, "Canteen updated");
  } catch (err) {
    next(err);
  }
}

async function toggleCanteen(req, res, next) {
  try {
    const canteen = await prisma.canteen.findUnique({
      where: { id: req.params.id },
    });
    if (!canteen) {
      return error(res, "Canteen not found", 404);
    }

    const updated = await prisma.canteen.update({
      where: { id: req.params.id },
      data: { isOpen: !canteen.isOpen },
    });
    return success(res, updated, `Canteen ${updated.isOpen ? "opened" : "closed"}`);
  } catch (err) {
    next(err);
  }
}

async function getMyCanteen(req, res, next) {
  try {
    const admin = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { managedCanteen: true },
    });
    if (!admin?.managedCanteen) return error(res, "No canteen assigned", 403);
    return success(res, admin.managedCanteen);
  } catch (err) {
    next(err);
  }
}

module.exports = { getAllCanteens, getCanteenById, createCanteen, updateCanteen, toggleCanteen, getMyCanteen };

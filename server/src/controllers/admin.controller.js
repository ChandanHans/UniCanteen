const prisma = require("../config/db");
const { success, error } = require("../utils/apiResponse");

// ─── Super Admin Dashboard ──────────────────────────────

async function getDashboard(req, res, next) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalUsers, totalOrders, todayOrders, totalRevenue, canteenStats] = await Promise.all([
      prisma.user.count(),
      prisma.order.count(),
      prisma.order.count({ where: { createdAt: { gte: today } } }),
      prisma.order.aggregate({
        where: { payment: { status: "SUCCESS" } },
        _sum: { totalAmount: true },
      }),
      prisma.canteen.findMany({
        select: {
          id: true,
          name: true,
          isOpen: true,
          _count: { select: { orders: true } },
        },
      }),
    ]);

    return success(res, {
      totalUsers,
      totalOrders,
      todayOrders,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      canteenStats,
    });
  } catch (err) {
    next(err);
  }
}

// ─── User Management ────────────────────────────────────

async function getUsers(req, res, next) {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const where = {};
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true, name: true, email: true, phone: true,
          role: true, isActive: true, hostelId: true,
          hostel: { select: { name: true } },
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: parseInt(limit),
      }),
      prisma.user.count({ where }),
    ]);

    return success(res, { users, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
}

async function updateUserRole(req, res, next) {
  try {
    const { role } = req.body;
    if (!["STUDENT", "CANTEEN_ADMIN", "SUPER_ADMIN"].includes(role)) {
      return error(res, "Invalid role", 400);
    }
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });
    return success(res, user, "Role updated");
  } catch (err) {
    next(err);
  }
}

async function toggleUserStatus(req, res, next) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return error(res, "User not found", 404);

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: !user.isActive },
      select: { id: true, name: true, isActive: true },
    });
    return success(res, updated, `User ${updated.isActive ? "activated" : "deactivated"}`);
  } catch (err) {
    next(err);
  }
}

// ─── Hostel Management ──────────────────────────────────

async function getHostels(req, res, next) {
  try {
    const hostels = await prisma.hostel.findMany({
      include: {
        canteen: { select: { id: true, name: true, isOpen: true } },
        _count: { select: { users: true } },
      },
      orderBy: { name: "asc" },
    });
    return success(res, hostels);
  } catch (err) {
    next(err);
  }
}

async function createHostel(req, res, next) {
  try {
    const hostel = await prisma.hostel.create({
      data: req.body,
    });
    return success(res, hostel, "Hostel created", 201);
  } catch (err) {
    next(err);
  }
}

async function updateHostel(req, res, next) {
  try {
    const hostel = await prisma.hostel.update({
      where: { id: req.params.id },
      data: req.body,
    });
    return success(res, hostel, "Hostel updated");
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDashboard, getUsers, updateUserRole, toggleUserStatus,
  getHostels, createHostel, updateHostel,
};

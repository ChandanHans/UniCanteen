const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../config/db");
const { generateAccessToken, generateRefreshToken } = require("../utils/generateToken");
const { success, error } = require("../utils/apiResponse");

async function register(req, res, next) {
  try {
    const { name, email, phone, password, hostelId } = req.body;

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { phone }] },
    });
    if (existing) {
      return error(res, "User with this email or phone already exists", 409);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { name, email, phone, passwordHash, hostelId },
      select: { id: true, name: true, email: true, phone: true, role: true, hostelId: true },
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return success(res, { user, accessToken }, "Registration successful", 201);
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { hostel: true, managedCanteen: true },
    });
    if (!user) {
      return error(res, "Invalid email or password", 401);
    }
    if (!user.isActive) {
      return error(res, "Account is deactivated. Contact admin.", 403);
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return error(res, "Invalid email or password", 401);
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const { passwordHash, ...userData } = user;

    return success(res, { user: userData, accessToken }, "Login successful");
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      return error(res, "Refresh token required", 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true, isActive: true },
    });
    if (!user || !user.isActive) {
      return error(res, "Invalid refresh token", 401);
    }

    const accessToken = generateAccessToken(user);
    return success(res, { accessToken }, "Token refreshed");
  } catch {
    return error(res, "Invalid refresh token", 401);
  }
}

async function getMe(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true, name: true, email: true, phone: true,
        role: true, hostelId: true, avatarUrl: true,
        hostel: true, managedCanteen: true,
      },
    });
    if (!user) {
      return error(res, "User not found", 404);
    }
    return success(res, user);
  } catch (err) {
    next(err);
  }
}

async function updateMe(req, res, next) {
  try {
    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: req.body,
      select: {
        id: true, name: true, email: true, phone: true,
        role: true, hostelId: true, avatarUrl: true, hostel: true,
      },
    });
    return success(res, user, "Profile updated");
  } catch (err) {
    next(err);
  }
}

async function logout(req, res) {
  res.clearCookie("refreshToken");
  return success(res, null, "Logged out");
}

module.exports = { register, login, refresh, getMe, updateMe, logout };

const jwt = require("jsonwebtoken");
const { error } = require("../utils/apiResponse");

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return error(res, "Access token required", 401);
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = decoded;
    next();
  } catch {
    return error(res, "Invalid or expired token", 401);
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return error(res, "Authentication required", 401);
    }
    if (!roles.includes(req.user.role)) {
      return error(res, "Insufficient permissions", 403);
    }
    next();
  };
}

module.exports = { authenticate, authorize };

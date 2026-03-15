const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

let io;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      credentials: true,
    },
  });

  // JWT authentication middleware for socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication required"));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    // Join personal notification room
    socket.join(`user:${socket.userId}`);

    // Canteen admins join their canteen room
    if (socket.userRole === "CANTEEN_ADMIN") {
      socket.on("join:canteen", (canteenId) => {
        socket.join(`canteen:${canteenId}`);
      });
    }

    // Join order tracking room
    socket.on("join:order", (orderId) => {
      socket.join(`order:${orderId}`);
    });

    socket.on("leave:order", (orderId) => {
      socket.leave(`order:${orderId}`);
    });

    socket.on("disconnect", () => {});
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
}

module.exports = { initSocket, getIO };

import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import logger from "./logger.js";

const parseCookies = (cookieStr)=>{
  if (!cookieStr) return {};
  return cookieStr.split(';').reduce((acc, cookie)=>{
    const [key, value] = cookie.trim().split('=');
    if(key && value) {
      acc[key] = value;
    }
    return acc;
  }, {});
};
let io;
export const initSocket = (server) => {
  const allowedOrigins = (process.env.FRONTEND_ORIGINS || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  });
  io.use((socket, next) => {
    try {
      const cookies = socket.handshake.headers.cookie;
      if (!cookies) {
        return next(new Error("Authentication error: No cookies found"));
      }
      const parsedCookies = parseCookies(cookies);
      const token = parsedCookies.token;
      if (!token) {
        return next(new Error("Authentication error: No token found"));
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id || decoded.userId || decoded._id; 
      next();
    } catch (err) {
      console.error("Socket JWT verification failed:", err.message);
      next(new Error("Authentication error"));
    }
  });
  io.on("connection", (socket) => {
    logger.info(`New client connected: ${socket.id}`);
    
    if (socket.userId) {
      socket.join(socket.userId.toString());
      logger.info(`Socket ${socket.id} automatically joined user room: ${socket.userId}`);
    }

    socket.on("disconnect", () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
};
export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io is not initialized!");
  }
  return io;
};
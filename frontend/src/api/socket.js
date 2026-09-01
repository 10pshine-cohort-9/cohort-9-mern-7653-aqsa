import { io } from "socket.io-client";
const rawUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
const SOCKET_URL = rawUrl.replace(/\/api\/?$/, "");
export const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true, 
  transports: ["polling", "websocket"],
});
socket.on("connect_error", (err) => {
  console.error("🔴 Socket Connection Error:", err.message);
});
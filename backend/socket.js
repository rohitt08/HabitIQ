import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import cookie from "cookie";

let io;

export const initSocket = (server, corsOptions) => {
  io = new Server(server, {
    cors: corsOptions,
  });

  io.use((socket, next) => {
    try {
      // First try to get token from handshake auth
      let token = socket.handshake.auth.token;
      
      // If not in auth, check cookies
      if (!token && socket.handshake.headers.cookie) {
        const cookies = cookie.parse(socket.handshake.headers.cookie);
        token = cookies.jwt;
      }
      
      if (!token) {
        return next(new Error("Authentication error"));
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    // Join a room for this specific user so we can emit directly to them
    socket.join(socket.user.id);

    // Clients can also subscribe to specific broadcast rooms
    socket.on("join_room", (room) => {
      socket.join(room);
    });
    
    socket.on("leave_room", (room) => {
      socket.leave(room);
    });

    socket.on("disconnect", () => {
      // console.log(`User disconnected: ${socket.user.id}`);
    });
  });

  return io;
};

export const getIo = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};

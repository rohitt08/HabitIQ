import { create } from 'zustand';
import { io } from "socket.io-client";

export const useSocketStore = create((set, get) => ({
  socket: null,

  connect: () => {
    const currentSocket = get().socket;
    if (currentSocket) return;

    const defaultBackendUrl = import.meta.env.PROD ? "" : `http://${window.location.hostname}:8000`;
    const backendUrl = (import.meta.env.VITE_API_URL || defaultBackendUrl).replace("/api", "");
    
    const newSocket = io(backendUrl || "/", {
      withCredentials: true,
    });

    newSocket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
    });

    set({ socket: newSocket });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.close();
      set({ socket: null });
    }
  }
}));

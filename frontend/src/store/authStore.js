import { create } from 'zustand';
import api from '../api/axios.js';

export const useAuthStore = create((set, get) => ({
  user: (() => {
    try {
      const raw = localStorage.getItem("user");
      if (!raw || raw === "undefined") return null;
      return JSON.parse(raw);
    } catch {
      localStorage.removeItem("user");
      return null;
    }
  })(),
  loading: true,

  initialize: async () => {
    sessionStorage.removeItem("ai-chat");
    localStorage.removeItem("ai-chat");
    try {
      const res = await api.get("/auth/me");
      set({ user: res.data.user, loading: false });
      localStorage.setItem("user", JSON.stringify(res.data.user));
      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
      }
    } catch {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      set({ user: null, loading: false });
    }
  },

  login: async (email, password, rememberMe = false) => {
    const res = await api.post("/auth/login", { email, password, rememberMe });
    localStorage.setItem("user", JSON.stringify(res.data.user));
    if (res.data.token) localStorage.setItem("token", res.data.token);
    set({ user: res.data.user });
    return res.data.user;
  },

  sendOtp: async (email) => {
    const res = await api.post("/auth/send-otp", { email });
    return res.data;
  },

  verifyOtp: async (email, otp) => {
    const res = await api.post("/auth/verify-otp", { email, otp });
    return res.data;
  },

  register: async (name, email, password, otp, rememberMe = false) => {
    const res = await api.post("/auth/register", { name, email, password, otp, rememberMe });
    localStorage.setItem("user", JSON.stringify(res.data.user));
    if (res.data.token) localStorage.setItem("token", res.data.token);
    set({ user: res.data.user });
    return res.data.user;
  },

  logout: async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.error(err);
    }
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("ai-chat");
    sessionStorage.removeItem("ai-chat");
    set({ user: null });
  },

  updateUser: (u) => {
    set({ user: u });
    localStorage.setItem("user", JSON.stringify(u));
  },

  updateSettings: async (settings) => {
    const res = await api.put("/auth/settings", settings);
    get().updateUser(res.data.user);
    return res.data.user;
  }
}));

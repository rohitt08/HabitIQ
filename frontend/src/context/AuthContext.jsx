import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios.js";

const AuthContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sessionStorage.removeItem("ai-chat");
    localStorage.removeItem("ai-chat");
    api
      .get("/auth/me")
      .then((res) => {
        setUser(res.data.user);
        localStorage.setItem("user", JSON.stringify(res.data.user));
      })
      .catch(() => {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    localStorage.setItem("user", JSON.stringify(res.data.user));
    if (res.data.token) {
      localStorage.setItem("token", res.data.token);
    }
    setUser(res.data.user);
    return res.data.user;
  };

  const sendOtp = async (email) => {
    const res = await api.post("/auth/send-otp", { email });
    return res.data;
  };

  const verifyOtp = async (email, otp) => {
    const res = await api.post("/auth/verify-otp", { email, otp });
    return res.data;
  };

  const register = async (name, email, password, otp) => {
    const res = await api.post("/auth/register", { name, email, password, otp });
    localStorage.setItem("user", JSON.stringify(res.data.user));
    if (res.data.token) {
      localStorage.setItem("token", res.data.token);
    }
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.error(err);
    }
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("ai-chat");
    sessionStorage.removeItem("ai-chat");
    setUser(null);
    window.location.href = "/";
  };

  const updateUser = (u) => {
    setUser(u);
    localStorage.setItem("user", JSON.stringify(u));
  };

  const updateSettings = async (settings) => {
    const res = await api.put("/auth/settings", settings);
    updateUser(res.data.user);
    return res.data.user;
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, updateUser, updateSettings, sendOtp, verifyOtp }}
    >
      {children}
    </AuthContext.Provider>
  );
};

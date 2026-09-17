/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const AuthContext = createContext();

const normalizeUser = (u) => {
  if (!u) return null;
  const roleStr = (u.role || "").toLowerCase();
  const isAdmin = roleStr.includes("admin");
  return {
    ...u,
    role: isAdmin ? "admin" : "customer",
    rawRole: u.role,
    full_name: u.full_name || u.fullName || "User",
    fullName: u.fullName || u.full_name || "User",
    avatar_url: u.avatar_url || u.avatarUrl || "",
    avatarUrl: u.avatarUrl || u.avatar_url || "",
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(() => {
    try {
      const saved = localStorage.getItem("user");
      return saved ? normalizeUser(JSON.parse(saved)) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  const setUser = (userData) => {
    const normalized = normalizeUser(userData);
    setUserState(normalized);
    if (normalized) {
      localStorage.setItem("user", JSON.stringify(normalized));
    } else {
      localStorage.removeItem("user");
    }
  };

  const fetchUser = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUserState(null);
      setLoading(false);
      return;
    }
    try {
      const res = await api.get("/auth/me");
      const userData = res.data?.data || res.data?.user || res.data;
      setUser(userData);
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUserState(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // ignore
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUserState(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
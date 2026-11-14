"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import * as authService from "@/services/authService";
import {
  ApiError,
  clearToken,
  getToken,
  setToken,
  setUnauthorizedHandler,
} from "@/lib/apiClient";

const AuthContext = createContext(null);

export function normalizeRole(peran) {
  return String(peran || "").toLowerCase(); // "admin" | "mekanik" | "owner"
}

// halaman awal setelah login: Owner ke dashboard, lainnya ke daftar order
export function homePathForRole(peran) {
  return normalizeRole(peran) === "owner" ? "/dashboard" : "/orders";
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true selama sesi dipulihkan
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    // dipanggil apiClient saat server membalas 401
    setUnauthorizedHandler(() => {
      setUser(null);
      setSessionExpired(true);
    });

    let cancelled = false;
    async function restore() {
      if (!getToken()) {
        setLoading(false);
        return;
      }
      try {
        const me = await authService.getMe();
        if (!cancelled) setUser(me);
      } catch {
        // 401 sudah ditangani oleh apiClient
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    restore();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (username, password) => {
    const data = await authService.login(username, password);
    // jaga-jaga bila format respons berubah: jangan simpan token kosong
    if (!data?.token || !data?.user) {
      throw new ApiError("Respons login tidak valid dari server.", 500);
    }
    setToken(data.token);
    setUser(data.user);
    setSessionExpired(false);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // kegagalan diabaikan, sesi klien tetap dihapus
    }
    clearToken();
    setUser(null);
  }, []);

  const clearSessionExpired = useCallback(() => setSessionExpired(false), []);

  const value = {
    user,
    role: normalizeRole(user?.peran),
    loading,
    sessionExpired,
    login,
    logout,
    clearSessionExpired,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth harus dipakai di dalam AuthProvider");
  return ctx;
}
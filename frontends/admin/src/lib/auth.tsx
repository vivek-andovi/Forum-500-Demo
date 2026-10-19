"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api, ApiError, getToken, onUnauthorized, setToken } from "@/lib/api";
import type { AuthUser, LoginResponse } from "@/lib/types";

type AuthState = {
  status: "loading" | "authenticated" | "anonymous";
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<AuthState["status"]>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setStatus("anonymous");
    queryClient.clear();
  }, [queryClient]);

  useEffect(() => {
    onUnauthorized(logout);
    return () => onUnauthorized(null);
  }, [logout]);

  // Restore session from localStorage and verify it.
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setStatus("anonymous");
      return;
    }
    let cancelled = false;
    api<{ user: AuthUser }>("/auth/me")
      .then((res) => {
        if (cancelled) return;
        if (res?.user?.role !== "admin") return logout();
        setUser(res.user);
        setStatus("authenticated");
      })
      .catch((e) => {
        if (cancelled) return;
        // Network error: keep the token and let pages surface errors.
        if (e instanceof ApiError && e.status === 0) {
          setStatus("authenticated");
          return;
        }
        logout();
      });
    return () => {
      cancelled = true;
    };
  }, [logout]);

  const login = useCallback(async (email: string, password: string) => {
    setToken(null);
    const res = await api<LoginResponse>("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    if (res.user?.role !== "admin") {
      throw new Error("This account does not have admin access.");
    }
    setToken(res.accessToken);
    setUser(res.user);
    setStatus("authenticated");
  }, []);

  const value = useMemo(() => ({ status, user, login, logout }), [status, user, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

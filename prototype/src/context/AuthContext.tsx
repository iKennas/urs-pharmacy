import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { adminApi, authApi } from "../api";
import { setToken, getStoredUser } from "../api/client";
import type { AuthUser, SystemAdmin } from "../api/types";

const ADMIN_EMAIL = "admin@urs-platform.sa";

function loadSession(): { user: AuthUser | null; admin: SystemAdmin | null } {
  const kind = localStorage.getItem("urs_session");
  const stored = getStoredUser<AuthUser | SystemAdmin>();
  if (kind === "admin" && stored) return { user: null, admin: stored as SystemAdmin };
  if (kind === "tenant" && stored) return { user: stored as AuthUser, admin: null };
  return { user: null, admin: null };
}

function persistSession(user: AuthUser | null, admin: SystemAdmin | null) {
  if (admin) {
    localStorage.setItem("urs_session", "admin");
    localStorage.setItem("urs_user", JSON.stringify(admin));
  } else if (user) {
    localStorage.setItem("urs_session", "tenant");
    localStorage.setItem("urs_user", JSON.stringify(user));
  } else {
    localStorage.removeItem("urs_session");
    localStorage.removeItem("urs_user");
  }
}

interface AuthState {
  user: AuthUser | null;
  admin: SystemAdmin | null;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<"admin" | "tenant">;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const initial = loadSession();
  const [user, setUser] = useState<AuthUser | null>(initial.user);
  const [admin, setAdmin] = useState<SystemAdmin | null>(initial.admin);
  const isAdmin = !!admin;

  const login = useCallback(async (email: string, password: string) => {
    if (email.toLowerCase() === ADMIN_EMAIL) {
      const res = await adminApi.login(email, password);
      setToken(res.accessToken);
      setAdmin(res.admin);
      setUser(null);
      persistSession(null, res.admin);
      return "admin" as const;
    }
    const res = await authApi.login(email, password);
    setToken(res.accessToken);
    setUser(res.user);
    setAdmin(null);
    persistSession(res.user, null);
    return "tenant" as const;
  }, []);

  const logout = useCallback(async () => {
    try {
      if (user) await authApi.logout();
    } catch {
      /* ignore */
    }
    setToken(null);
    persistSession(null, null);
    setUser(null);
    setAdmin(null);
  }, [user]);

  const value = useMemo(() => ({ user, admin, isAdmin, login, logout }), [user, admin, isAdmin, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

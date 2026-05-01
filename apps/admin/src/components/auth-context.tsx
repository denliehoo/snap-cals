import type { AdminProfile } from "@snap-cals/shared";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { post } from "../services/api";

interface AuthContextValue {
  admin: AdminProfile | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("admin_user");
    if (stored) {
      setAdmin(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await post<{
      data: { token: string; admin: AdminProfile };
    }>("/admin/auth/login", { email, password });
    localStorage.setItem("admin_token", res.data.token);
    localStorage.setItem("admin_user", JSON.stringify(res.data.admin));
    setAdmin(res.data.admin);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    setAdmin(null);
  }, []);

  return (
    <AuthContext.Provider value={{ admin, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

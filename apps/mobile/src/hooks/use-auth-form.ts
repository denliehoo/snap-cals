import { useState } from "react";
import { useAuthStore } from "@/stores/auth.store";

export function useAuthForm(mode: "login" | "signup", onError: (msg: string) => void) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const authAction = useAuthStore((s) => (mode === "login" ? s.login : s.signup));

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const submit = async () => {
    const errors: Record<string, string> = {};
    if (!email) errors.email = "Email is required";
    if (!password) errors.password = "Password is required";
    else if (mode === "signup" && password.length < 6) errors.password = "Must be at least 6 characters";
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    try {
      await authAction(email.trim().toLowerCase(), password);
    } catch (e: any) {
      onError(e.message || `${mode === "login" ? "Login" : "Signup"} failed`);
    } finally {
      setLoading(false);
    }
  };

  return { email, setEmail, password, setPassword, loading, fieldErrors, clearFieldError, submit };
}

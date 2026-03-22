import { useState } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { getErrorMessage } from "@/utils/error";

export function useAuthForm(
  mode: "login" | "signup",
  onError: (msg: string) => void,
  onVerificationNeeded: (userId: string) => void,
) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const login = useAuthStore((s) => s.login);
  const signup = useAuthStore((s) => s.signup);

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
    else if (mode === "signup" && password.length < 6)
      errors.password = "Must be at least 6 characters";
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    try {
      const trimmedEmail = email.trim().toLowerCase();
      if (mode === "signup") {
        const userId = await signup(trimmedEmail, password);
        onVerificationNeeded(userId);
      } else {
        const userId = await login(trimmedEmail, password);
        if (userId) onVerificationNeeded(userId);
      }
    } catch (e: unknown) {
      onError(
        getErrorMessage(e, `${mode === "login" ? "Login" : "Signup"} failed`),
      );
    } finally {
      setLoading(false);
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    loading,
    fieldErrors,
    clearFieldError,
    submit,
  };
}

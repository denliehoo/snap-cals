import { useState } from "react";
import { useAuthStore } from "@/stores/auth.store";

export function useAuthForm(mode: "login" | "signup") {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const authAction = useAuthStore((s) => (mode === "login" ? s.login : s.signup));

  const submit = async () => {
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }
    if (mode === "signup" && password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await authAction(email.trim().toLowerCase(), password);
    } catch (e: any) {
      setError(e.message || `${mode === "login" ? "Login" : "Signup"} failed`);
    } finally {
      setLoading(false);
    }
  };

  return { email, setEmail, password, setPassword, loading, error, submit };
}

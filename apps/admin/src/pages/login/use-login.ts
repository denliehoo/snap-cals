import { useState } from "react";
import { useAuth } from "@/components/auth-context";

export function useLogin() {
  const { admin, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return {
    admin,
    email,
    setEmail,
    password,
    setPassword,
    error,
    loading,
    handleSubmit,
  };
}
